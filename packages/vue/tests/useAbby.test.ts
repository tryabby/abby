import { AbbyEventType, HttpService } from "@tryabby/core";
import * as validation from "@tryabby/core/validation";
import { mount } from "@vue/test-utils";
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from "vitest";
import { type Component, defineComponent, h, nextTick } from "vue";
import { createAbby } from "../src";
import { TestStorageService } from "../src/StorageService";

const OLD_ENV = process.env;

beforeEach(() => {
  document.cookie = "";
  vi.resetModules();
  process.env = { ...OLD_ENV };
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(() => {
  process.env = OLD_ENV;
});

function withTestComponent<T>(
  composable: () => T,
  AbbyProvider: Component
): { result: T; wrapper: ReturnType<typeof mount> } {
  let result!: T;
  const Child = defineComponent({
    setup() {
      result = composable();
      return () => h("div");
    },
  });

  const wrapper = mount(
    defineComponent({
      setup() {
        return () => h(AbbyProvider, null, { default: () => h(Child) });
      },
    })
  );

  return { result, wrapper };
}

describe("useAbby", () => {
  it("returns the correct amount of options", () => {
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

    const { result } = withTestComponent(() => useAbby("test"), AbbyProvider);

    expect(spy).toHaveBeenCalled();
    expect(result.variant.value).toBeDefined();
  });

  it("should use the persistedValue", () => {
    const persistedValue = "SimonsText";
    const variants = ["SimonsText", "MatthiasText", "TomsText", "TimsText"];

    const getSpy = vi.spyOn(TestStorageService, "get");
    const setSpy = vi.spyOn(TestStorageService, "set");

    getSpy.mockReturnValue(persistedValue);

    const { AbbyProvider, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants },
      },
    });

    const { result } = withTestComponent(() => useAbby("test"), AbbyProvider);

    // the stored value should not be overwritten
    expect(setSpy).not.toHaveBeenCalled();

    // value set in storage
    expect(result.variant.value).toEqual(persistedValue);
    expect(result.variant.valueOf()).toBe(persistedValue);
    expect(String(result.variant)).toEqual(persistedValue);
  });

  it("looks up the selected variant in the lookup object", () => {
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

    const { result } = withTestComponent(
      () =>
        useAbby("test", {
          SimonsText: "a",
          MatthiasText: "b",
          TomsText: "c",
          TimsText: "d",
        }),
      AbbyProvider
    );

    expect(result.variant.value).toEqual("a");
    expect(result.variant.valueOf()).toBe("a");
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

    withTestComponent(() => useAbby("test"), AbbyProvider);
    await nextTick();

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

    const { result } = withTestComponent(() => useAbby("test"), AbbyProvider);
    await nextTick();

    result.onAct();

    expect(spy).toHaveBeenNthCalledWith(
      2,
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

    let flag1!: ReturnType<typeof useFeatureFlag>;
    let flag2!: ReturnType<typeof useFeatureFlag>;

    withTestComponent(() => {
      flag1 = useFeatureFlag("flag1");
      flag2 = useFeatureFlag("flag2");
    }, AbbyProvider);

    expect(flag1.value).toEqual(false);
    expect(flag2.value).toEqual(false);

    // wait for mock API response
    await vi.waitFor(() => expect(flag1.value).toEqual(true));
    expect(flag2.value).toEqual(false);
  });

  it("should respect the default values for feature flags", async () => {
    const { AbbyProvider, useFeatureFlag } = createAbby({
      environments: [],
      projectId: "123",
      flags: ["flag1", "flag2"],
      currentEnvironment: "a",
    });

    const { result: flag1 } = withTestComponent(
      () => useFeatureFlag("flag1"),
      AbbyProvider
    );

    expect(flag1.value).toEqual(false);
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

    let flag1!: ReturnType<typeof useFeatureFlag>;
    let flag2!: ReturnType<typeof useFeatureFlag>;

    withTestComponent(() => {
      flag1 = useFeatureFlag("flag1");
      flag2 = useFeatureFlag("flag2");
    }, AbbyProvider);

    expect(flag1.value).toEqual(false);
    expect(flag2.value).toEqual(true);
  });

  it("gets the stored feature flag value using a function properly", async () => {
    const { getFeatureFlagValue, AbbyProvider } = createAbby({
      environments: [],
      projectId: "123",
      flags: ["flag1", "flag2"],
      currentEnvironment: "a",
    });

    withTestComponent(() => {}, AbbyProvider);

    await vi.waitFor(() => expect(getFeatureFlagValue("flag1")).toEqual(true));
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

  it("produces proper types with a lookup object", () => {
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

  it("produces proper types with a lookup object in the hook", () => {
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

    const { result } = withTestComponent(
      () =>
        useAbby("test", {
          A: "Hello",
          B: "Bonjour",
          C: "Hola",
        }),
      AbbyProvider
    );

    expectTypeOf(result.variant.value).toEqualTypeOf<
      "Hello" | "Bonjour" | "Hola"
    >();
  });

  it("returns correct remoteConfigValue", async () => {
    const { useRemoteConfig, AbbyProvider } = createAbby({
      environments: [],
      projectId: "123",
      remoteConfig: {
        remoteConfig1: "String",
      },
      currentEnvironment: "a",
    });

    const { result } = withTestComponent(
      () => useRemoteConfig("remoteConfig1"),
      AbbyProvider
    );

    await vi.waitFor(() => expect(result.value).toEqual("FooBar"));
    expect(result.valueOf()).toBe("FooBar");
    expect(String(result)).toEqual("FooBar");
  });

  it("uses defaultValues when remoteConfig is not set", () => {
    const { useRemoteConfig, AbbyProvider } = createAbby({
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

    const { result } = withTestComponent(
      () => useRemoteConfig("unsetRemoteConfig"),
      AbbyProvider
    );

    expect(result.value).toEqual("defaultValue");
  });

  it("uses devOverride for remoteConfig", () => {
    process.env.NODE_ENV = "development";
    const { useRemoteConfig, AbbyProvider } = createAbby({
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

    const { result } = withTestComponent(
      () => useRemoteConfig("remoteConfig1"),
      AbbyProvider
    );

    expect(result.value).toEqual("overwrittenValue");
  });

  it("throws an error when useAbby is used without AbbyProvider in a component", () => {
    const { useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["A", "B"] },
      },
    });

    const InvalidComponent = defineComponent({
      setup() {
        useAbby("test");
        return () => h("div");
      },
    });

    expect(() => mount(InvalidComponent)).toThrowError(
      "useAbbyData must be used within an AbbyProvider. Wrap a parent component in <AbbyProvider> to fix this error."
    );
  });

  it("works with AbbyPlugin via app.use", () => {
    const { AbbyPlugin, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["A", "B"] },
      },
    });

    let res!: ReturnType<typeof useAbby>;
    const Child = defineComponent({
      setup() {
        res = useAbby("test");
        return () => h("div");
      },
    });

    mount(Child, {
      global: {
        plugins: [AbbyPlugin],
      },
    });

    expect(res.variant.value).toBeDefined();
  });

  it("allows resetting an A/B test", () => {
    const removeSpy = vi.spyOn(TestStorageService, "remove");
    const { getABResetFunction } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["A", "B"] },
      },
    });

    const reset = getABResetFunction("test");
    reset();

    expect(removeSpy).toHaveBeenCalledWith("123", "test");
  });

  it("allows updating user properties", () => {
    const { updateUserProperties, __abby__ } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      user: {
        name: validation.string(),
      },
    });

    const spy = vi.spyOn(__abby__, "updateUserProperties");
    updateUserProperties({ name: "Alice" });
    expect(spy).toHaveBeenCalledWith({ name: "Alice" });
  });
});

describe("useFeatureFlags()", () => {
  it("returns the correct list of feature flags", async () => {
    const { AbbyProvider, useFeatureFlags } = createAbby({
      environments: [],
      currentEnvironment: "test",
      projectId: "123",
      flags: ["flag1"],
    });

    const { result } = withTestComponent(() => useFeatureFlags(), AbbyProvider);

    expectTypeOf(result.value).toEqualTypeOf<
      Array<{
        name: "flag1";
        value: boolean;
      }>
    >();

    expect(result.value).toHaveLength(1);

    await vi.waitFor(() =>
      expect(result.value[0]).toEqual({
        name: "flag1",
        value: true,
      })
    );
  });
});

describe("useRemoteConfigVariables()", () => {
  it("returns the correct list of remote config variables", () => {
    const { AbbyProvider, useRemoteConfigVariables } = createAbby({
      environments: [],
      currentEnvironment: "test",
      projectId: "123",
      remoteConfig: {
        remoteConfig1: "String",
      },
    });

    const { result } = withTestComponent(
      () => useRemoteConfigVariables(),
      AbbyProvider
    );

    expectTypeOf(result.value).toEqualTypeOf<
      Array<{
        name: "remoteConfig1";
        value: string;
      }>
    >();

    expect(result.value).toHaveLength(1);
    expect(result.value[0]).toEqual({
      name: "remoteConfig1",
      value: expect.any(String),
    });
  });
});
