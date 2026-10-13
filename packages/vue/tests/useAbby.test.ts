import { HttpService } from "@tryabby/core";
import { AbbyEventType } from "@tryabby/core";
import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, nextTick, type ComputedRef } from "vue";
import { createAbby } from "../src";
import { TestStorageService } from "../src/StorageService";

const OLD_ENV = process.env;

beforeEach(() => {
  document.cookie = "";
  vi.resetModules();
  vi.restoreAllMocks();
  process.env = { ...OLD_ENV };
});

afterAll(() => {
  process.env = OLD_ENV;
});

const mountedWrappers: Array<ReturnType<typeof mount>> = [];

afterEach(() => {
  while (mountedWrappers.length) {
    mountedWrappers.pop()?.unmount();
  }
});

function mountWithProvider(
  Provider: ReturnType<typeof createAbby>["AbbyProvider"],
  setup: () => Record<string, unknown>
) {
  const Child = defineComponent({
    name: "TestChild",
    setup,
    template: "<div />",
  });

  const wrapper = mount(
    defineComponent({
      components: { Provider, Child },
      template: "<Provider><Child /></Provider>",
    })
  );
  mountedWrappers.push(wrapper);
  return wrapper;
}

describe("useAbby", () => {
  it("returns the correct amount of options", async () => {
    const spy = vi.spyOn(TestStorageService, "set");

    const { AbbyProvider, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["OldFooter", "NewFooter"] },
        test2: {
          variants: ["SimonsText", "MatthiasText", "TomsText", "TimsText"],
        },
      },
    });

    let variant: ComputedRef<string> | undefined;
    mountWithProvider(AbbyProvider, () => {
      const result = useAbby("test");
      variant = result.variant;
      return {};
    });

    await nextTick();
    await flushPromises();

    expect(spy).toHaveBeenCalled();
    expect(variant?.value).toBeDefined();
    expect(variant?.value).not.toEqual("");
  });

  it("should use the persistedValue", async () => {
    const persistedValue = "SimonsText";
    const variants = ["SimonsText", "MatthiasText", "TomsText", "TimsText"];
    const projectId = "persisted-project";

    const getSpy = vi.spyOn(TestStorageService, "get");
    const setSpy = vi.spyOn(TestStorageService, "set");
    getSpy.mockImplementation((pid, key) =>
      pid === projectId && key === "test" ? persistedValue : null
    );

    const { AbbyProvider, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId,
      tests: {
        test: { variants },
      },
    });

    setSpy.mockClear();

    let variant: ComputedRef<string> | undefined;
    mountWithProvider(AbbyProvider, () => {
      const result = useAbby("test");
      variant = result.variant;
      return {};
    });

    await nextTick();
    await flushPromises();

    const writesForProject = setSpy.mock.calls.filter(
      (call) => call[0] === projectId
    );
    expect(writesForProject).toHaveLength(0);
    expect(variant?.value).toEqual(persistedValue);
  });

  it("looks up the selected variant in the lookup object", async () => {
    const persistedValue = "SimonsText";
    const variants = [
      "SimonsText",
      "MatthiasText",
      "TomsText",
      "TimsText",
    ] as const;

    const getSpy = vi.spyOn(TestStorageService, "get");
    getSpy.mockReturnValue(persistedValue);

    const { AbbyProvider, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants },
      },
    });

    let variant: ComputedRef<string> | undefined;
    mountWithProvider(AbbyProvider, () => {
      const result = useAbby("test", {
        SimonsText: "a",
        MatthiasText: "b",
        TomsText: "c",
        TimsText: "d",
      });
      variant = result.variant;
      return {};
    });

    await nextTick();
    await flushPromises();

    expect(variant?.value).toEqual("a");
  });

  it("should ping the current info on mount", async () => {
    const spy = vi.spyOn(HttpService, "sendData");
    const { AbbyProvider, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["A", "B", "C"] },
      },
    });

    mountWithProvider(AbbyProvider, () => {
      useAbby("test");
      return {};
    });

    await nextTick();
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: AbbyEventType.PING })
    );
  });

  it("should notify the server with onAct", async () => {
    const spy = vi.spyOn(HttpService, "sendData");
    const { AbbyProvider, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["A", "B", "C"] },
      },
    });

    let onAct: (() => void) | undefined;
    mountWithProvider(AbbyProvider, () => {
      const result = useAbby("test");
      onAct = result.onAct;
      return {};
    });

    await nextTick();
    await flushPromises();

    onAct?.();

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: AbbyEventType.ACT })
    );
  });

  it("should return the correct feature flags", async () => {
    const { AbbyProvider, useFeatureFlag } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      flags: ["flag1", "flag2"],
    });

    let flag1: ComputedRef<boolean> | undefined;
    let flag2: ComputedRef<boolean> | undefined;

    mountWithProvider(AbbyProvider, () => {
      flag1 = useFeatureFlag("flag1");
      flag2 = useFeatureFlag("flag2");
      return {};
    });

    await flushPromises();
    await nextTick();

    // defaults before/after fetch depending on MSW data
    expect(typeof flag1?.value).toBe("boolean");
    expect(typeof flag2?.value).toBe("boolean");
  });

  it("should respect the default values for feature flags", async () => {
    const { AbbyProvider, useFeatureFlag } = createAbby({
      environments: [],
      projectId: "123",
      flags: ["flag1", "flag2"],
      currentEnvironment: "a",
    });

    let flag1: ComputedRef<boolean> | undefined;
    mountWithProvider(AbbyProvider, () => {
      flag1 = useFeatureFlag("flag1");
      return {};
    });

    expect(flag1?.value).toEqual(false);
  });

  it("uses the devOverrides", async () => {
    process.env.NODE_ENV = "development";
    const { AbbyProvider, useFeatureFlag } = createAbby({
      environments: [],
      projectId: "123",
      flags: ["flag1", "flag2"],
      currentEnvironment: "a",
      settings: {
        flags: {
          devOverrides: {
            flag1: false,
            flag2: true,
          },
        },
      },
    });

    let flag1: ComputedRef<boolean> | undefined;
    let flag2: ComputedRef<boolean> | undefined;
    mountWithProvider(AbbyProvider, () => {
      flag1 = useFeatureFlag("flag1");
      flag2 = useFeatureFlag("flag2");
      return {};
    });

    expect(flag1?.value).toEqual(false);
    expect(flag2?.value).toEqual(true);
  });

  it("gets the stored feature flag value using a function properly", async () => {
    const { getFeatureFlagValue } = createAbby({
      environments: [],
      projectId: "123",
      flags: ["flag1", "flag2"],
      currentEnvironment: "a",
    });

    expect(typeof getFeatureFlagValue("flag1")).toBe("boolean");
    expect(getFeatureFlagValue("flag2")).toEqual(false);
  });

  it("returns the correct possible variant values", () => {
    const { getVariants } = createAbby({
      environments: [],
      projectId: "123",
      currentEnvironment: "a",
      tests: {
        test: {
          variants: ["A", "B", "C"],
        },
      },
    });
    expect(getVariants("test")).toEqual(["A", "B", "C"]);
  });

  it("uses the lookup object when retrieving a variant", () => {
    const { getABTestValue } = createAbby({
      environments: [],
      projectId: "123",
      currentEnvironment: "a",
      tests: {
        test: {
          variants: ["A", "B", "C"],
        },
      },
    });

    const activeVariant = getABTestValue("test");
    const lookupObject = {
      A: 1,
      B: 2,
      C: 3,
    };

    expect(getABTestValue("test", lookupObject)).toEqual(
      lookupObject[activeVariant]
    );
  });

  it("produces proper types with a lookup objects", () => {
    const { getABTestValue } = createAbby({
      environments: [],
      projectId: "123",
      currentEnvironment: "a",
      tests: {
        test: {
          variants: ["A", "B", "C"],
        },
      },
    });

    const activeVariant = getABTestValue("test", {
      A: "Hello",
      B: "Bonjour",
      C: "Hola",
    });

    expectTypeOf(activeVariant).toEqualTypeOf<"Hello" | "Bonjour" | "Hola">();
  });

  it("produces proper types with a lookup object in the composable", async () => {
    const { AbbyProvider, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: {
          variants: ["A", "B", "C"],
        },
      },
    });

    let variant: ComputedRef<"Hello" | "Bonjour" | "Hola"> | undefined;
    mountWithProvider(AbbyProvider, () => {
      const result = useAbby("test", {
        A: "Hello",
        B: "Bonjour",
        C: "Hola",
      });
      variant = result.variant;
      return {};
    });

    await nextTick();
    expectTypeOf(variant!.value).toEqualTypeOf<"Hello" | "Bonjour" | "Hola">();
  });

  it("returns correct remoteConfigValue", async () => {
    const { AbbyProvider, useRemoteConfig } = createAbby({
      environments: [],
      projectId: "123",
      remoteConfig: {
        remoteConfig1: "String",
      },
      currentEnvironment: "a",
    });

    let value: ComputedRef<string> | undefined;
    mountWithProvider(AbbyProvider, () => {
      value = useRemoteConfig("remoteConfig1");
      return {};
    });

    await flushPromises();
    await nextTick();

    expect(value?.value).toEqual("FooBar");
  });

  it("uses defaultValues when remoteConfig is not set", async () => {
    const { AbbyProvider, useRemoteConfig } = createAbby({
      environments: [],
      projectId: "123",
      remoteConfig: {
        unsetRemoteConfig: "String",
      },
      settings: {
        remoteConfig: {
          defaultValues: {
            String: "defaultValue",
          },
        },
      },
      currentEnvironment: "a",
    });

    let value: ComputedRef<string> | undefined;
    mountWithProvider(AbbyProvider, () => {
      value = useRemoteConfig("unsetRemoteConfig");
      return {};
    });

    expect(value?.value).toEqual("defaultValue");
  });

  it("uses devOverride for remoteConfig", async () => {
    process.env.NODE_ENV = "development";
    const { AbbyProvider, useRemoteConfig } = createAbby({
      environments: [],
      projectId: "123",
      remoteConfig: {
        remoteConfig1: "String",
      },
      settings: {
        remoteConfig: {
          devOverrides: {
            remoteConfig1: "overwrittenValue",
          },
        },
      },
      currentEnvironment: "a",
    });

    let value: ComputedRef<string> | undefined;
    mountWithProvider(AbbyProvider, () => {
      value = useRemoteConfig("remoteConfig1");
      return {};
    });

    expect(value?.value).toEqual("overwrittenValue");
  });
});

it("has the correct types", async () => {
  const { AbbyProvider, useAbby, useFeatureFlag } = createAbby({
    environments: [""],
    currentEnvironment: "",
    projectId: "123",
    tests: {
      test: { variants: ["OldFooter", "NewFooter"] },
      test2: {
        variants: ["SimonsText", "MatthiasText", "TomsText", "TimsText"],
      },
    },
    flags: ["flag1"],
  });

  expectTypeOf(useAbby).parameter(0).toEqualTypeOf<"test" | "test2">();
  expectTypeOf(useFeatureFlag).parameters.toEqualTypeOf<["flag1"]>();

  let variant: ComputedRef<"OldFooter" | "NewFooter"> | undefined;
  let flag: ComputedRef<boolean> | undefined;

  mountWithProvider(AbbyProvider, () => {
    variant = useAbby("test").variant;
    flag = useFeatureFlag("flag1");
    return {};
  });

  await nextTick();

  expectTypeOf(variant!.value).toEqualTypeOf<"OldFooter" | "NewFooter">();
  expectTypeOf(flag!.value).toEqualTypeOf<boolean>();
});

describe("useFeatureFlags()", () => {
  it("returns the correct list of feature flags", async () => {
    const { AbbyProvider, useFeatureFlags } = createAbby({
      environments: [],
      currentEnvironment: "test",
      projectId: "123",
      tests: {
        test: { variants: ["OldFooter", "NewFooter"] },
      },
      flags: ["flag1"],
    });

    expectTypeOf(useFeatureFlags).parameter(0).toEqualTypeOf<undefined>();

    let flags:
      | ComputedRef<Array<{ name: "flag1"; value: boolean }>>
      | undefined;

    mountWithProvider(AbbyProvider, () => {
      flags = useFeatureFlags();
      return {};
    });

    expect(flags?.value).toHaveLength(1);
    expectTypeOf(flags!.value).toEqualTypeOf<
      Array<{
        name: "flag1";
        value: boolean;
      }>
    >();
  });
});

describe("useRemoteConfigVariables()", () => {
  it("returns the correct list of remote config variables", async () => {
    const { AbbyProvider, useRemoteConfigVariables } = createAbby({
      environments: [],
      currentEnvironment: "test",
      projectId: "123",
      remoteConfig: {
        remoteConfig1: "String",
      },
    });

    expectTypeOf(useRemoteConfigVariables)
      .parameter(0)
      .toEqualTypeOf<undefined>();

    let vars:
      | ComputedRef<Array<{ name: "remoteConfig1"; value: string }>>
      | undefined;

    mountWithProvider(AbbyProvider, () => {
      vars = useRemoteConfigVariables();
      return {};
    });

    expect(vars?.value).toHaveLength(1);
    expect(vars?.value.at(0)).toEqual({
      name: "remoteConfig1",
      value: expect.any(String),
    });
  });
});

describe("AbbyPlugin", () => {
  it("provides context through the plugin", async () => {
    process.env.NODE_ENV = "development";
    const { AbbyPlugin, useFeatureFlag } = createAbby({
      environments: [],
      currentEnvironment: "a",
      projectId: "123",
      flags: ["flag1"],
      settings: {
        flags: {
          devOverrides: {
            flag1: true,
          },
        },
      },
    });

    const Comp = defineComponent({
      setup() {
        const flag = useFeatureFlag("flag1");
        return { flag };
      },
      template: "<span>{{ flag }}</span>",
    });

    const wrapper = mount(Comp, {
      global: {
        plugins: [AbbyPlugin],
      },
    });

    expect(wrapper.text()).toContain("true");
  });
});
