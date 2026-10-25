import { AbbyEventType, HttpService } from "@tryabby/core";
import { mount } from "@vue/test-utils";
import { defineComponent, h, nextTick } from "vue";
import { createAbby } from "../src";
import { TestStorageService } from "../src/StorageService";

const OLD_ENV = process.env;

function renderComposable<T>(
  composable: () => T,
  Provider?: ReturnType<typeof createAbby>["AbbyProvider"]
): { result: T; unmount: () => void } {
  let result!: T;

  const Child = defineComponent({
    setup() {
      result = composable();
      return () => h("div");
    },
  });

  const Root = Provider
    ? defineComponent({
        setup() {
          return () => h(Provider, null, { default: () => h(Child) });
        },
      })
    : Child;

  const wrapper = mount(Root);

  return {
    result,
    unmount: () => wrapper.unmount(),
  };
}

beforeEach(() => {
  document.cookie = "";
  vi.resetModules();
  process.env = { ...OLD_ENV };
});

afterAll(() => {
  process.env = OLD_ENV;
});

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

    const { result } = renderComposable(() => useAbby("test"), AbbyProvider);

    expect(spy).toHaveBeenCalled();
    expect(result.variant.value).toBeDefined();
    expect(["OldFooter", "NewFooter"]).toContain(result.variant.value);
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

    const { result } = renderComposable(() => useAbby("test"), AbbyProvider);

    expect(setSpy).not.toHaveBeenCalled();
    expect(result.variant.value).toEqual(persistedValue);
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

    const { result } = renderComposable(
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
  });

  it("should ping the current info on mount", () => {
    const spy = vi.spyOn(HttpService, "sendData");
    const { AbbyProvider, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["A", "B", "C"] },
      },
    });

    renderComposable(() => useAbby("test"), AbbyProvider);

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: AbbyEventType.PING })
    );
  });

  it("should notify the server with onAct", () => {
    const spy = vi.spyOn(HttpService, "sendData");
    const { AbbyProvider, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["A", "B", "C"] },
      },
    });

    const { result } = renderComposable(() => useAbby("test"), AbbyProvider);

    result.onAct();

    expect(spy).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ type: AbbyEventType.ACT })
    );
  });

  it("should return the correct feature flags", async () => {
    const { AbbyProvider, useFeatureFlag, __abby__ } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      flags: ["flag1", "flag2"],
    });

    const { result: flag1 } = renderComposable(
      () => useFeatureFlag("flag1"),
      AbbyProvider
    );
    const { result: flag2 } = renderComposable(
      () => useFeatureFlag("flag2"),
      AbbyProvider
    );

    await __abby__.loadProjectData();
    await nextTick();

    expect(flag1.value).toEqual(true);
    expect(flag2.value).toEqual(false);
  });

  it("should respect the default values for feature flags", () => {
    const { AbbyProvider, useFeatureFlag } = createAbby({
      environments: [],
      projectId: "123",
      flags: ["flag1", "flag2"],
      currentEnvironment: "a",
    });

    const { result: flag1 } = renderComposable(
      () => useFeatureFlag("flag1"),
      AbbyProvider
    );
    expect(flag1.value).toEqual(false);
  });

  it("uses the devOverrides", () => {
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

    const { result: flag1 } = renderComposable(
      () => useFeatureFlag("flag1"),
      AbbyProvider
    );
    expect(flag1.value).toEqual(false);

    const { result: flag2 } = renderComposable(
      () => useFeatureFlag("flag2"),
      AbbyProvider
    );
    expect(flag2.value).toEqual(true);
  });

  it("gets the stored feature flag value using a function properly", async () => {
    const { getFeatureFlagValue, __abby__ } = createAbby({
      environments: [],
      projectId: "123",
      flags: ["flag1", "flag2"],
      currentEnvironment: "a",
    });

    await __abby__.loadProjectData();
    expect(getFeatureFlagValue("flag1")).toEqual(true);
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

  it("produces proper types with a lookup object in the composable", () => {
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

    const { result } = renderComposable(
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
    const { AbbyProvider, useRemoteConfig, __abby__ } = createAbby({
      environments: [],
      projectId: "123",
      remoteConfig: {
        remoteConfig1: "String",
      },
      currentEnvironment: "a",
    });

    const { result } = renderComposable(
      () => useRemoteConfig("remoteConfig1"),
      AbbyProvider
    );

    await __abby__.loadProjectData();
    await nextTick();

    expect(result.value).toEqual("FooBar");
  });

  it("uses defaultValues when remoteConfig is not set", () => {
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

    const { result } = renderComposable(
      () => useRemoteConfig("unsetRemoteConfig"),
      AbbyProvider
    );

    expect(result.value).toEqual("defaultValue");
  });

  it("uses devOverride for remoteConfig", () => {
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

    const { result } = renderComposable(
      () => useRemoteConfig("remoteConfig1"),
      AbbyProvider
    );

    expect(result.value).toEqual("overwrittenValue");
  });
});

it("has the correct types", () => {
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

  const { result } = renderComposable(() => useAbby("test"), AbbyProvider);

  expectTypeOf(result.variant.value).toEqualTypeOf<"OldFooter" | "NewFooter">();

  expectTypeOf(useFeatureFlag).parameters.toEqualTypeOf<["flag1"]>();

  const { result: ffResult } = renderComposable(
    () => useFeatureFlag("flag1"),
    AbbyProvider
  );

  expectTypeOf(ffResult.value).toEqualTypeOf<boolean>();
});

describe("useFeatureFlags()", () => {
  it("returns the correct list of feature flags", async () => {
    const { AbbyProvider, useFeatureFlags, __abby__ } = createAbby({
      environments: [],
      currentEnvironment: "test",
      projectId: "123",
      tests: {
        test: { variants: ["OldFooter", "NewFooter"] },
        test2: {
          variants: ["SimonsText", "MatthiasText", "TomsText", "TimsText"],
        },
      },
      flags: ["flag1"],
    });

    expectTypeOf(useFeatureFlags).parameter(0).toEqualTypeOf<undefined>();

    const { result } = renderComposable(() => useFeatureFlags(), AbbyProvider);

    expectTypeOf(result.value).toEqualTypeOf<
      Array<{
        name: "flag1";
        value: boolean;
      }>
    >();

    expect(result.value).toHaveLength(1);

    await __abby__.loadProjectData();
    await nextTick();

    expect(result.value.at(0)).toEqual({
      name: "flag1",
      value: true,
    });
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

    expectTypeOf(useRemoteConfigVariables)
      .parameter(0)
      .toEqualTypeOf<undefined>();

    const { result } = renderComposable(
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
    expect(result.value.at(0)).toEqual({
      name: "remoteConfig1",
      value: expect.any(String),
    });
  });
});

describe("abbyPlugin & withAbby (Vue 3 Plugin + Nuxt 3 SSR helper)", () => {
  it("installs via Vue app.use(abbyPlugin) and provides reactive state", () => {
    const { abbyPlugin, useFeatureFlag } = createAbby({
      environments: ["prod"],
      currentEnvironment: "prod",
      projectId: "123",
      flags: ["flag1"],
    });

    let flagVal = false;
    const Comp = defineComponent({
      setup() {
        const flag = useFeatureFlag("flag1");
        flagVal = flag.value;
        return () => h("span", String(flag.value));
      },
    });

    mount(Comp, {
      global: {
        plugins: [
          [
            abbyPlugin,
            {
              initialData: {
                flags: [{ name: "flag1", value: true }],
                tests: [],
                remoteConfig: [],
              },
            },
          ],
        ],
      },
    });

    expect(flagVal).toBe(true);
  });

  it("loads server data and applies cookies with withAbby", async () => {
    const { withAbby } = createAbby({
      environments: ["prod"],
      currentEnvironment: "prod",
      projectId: "123",
      flags: ["flag1"],
    });

    const loader = withAbby(async () => ({ customProp: 42 }));
    const res = await loader({
      node: { req: { headers: { cookie: "__abby_ff_123_flag1=false" } } },
    });

    expect(res.customProp).toBe(42);
    expect(res.__abby__data).toBeDefined();
    expect(res.__abby_cookie).toContain("__abby_ff_123_flag1=false");
  });

  it("forwards user properties cleanly in withAbby options", async () => {
    const { withAbby } = createAbby({
      environments: ["prod"],
      currentEnvironment: "prod",
      projectId: "123",
      flags: ["flag1"],
    });

    const loader = withAbby(async () => ({ ok: true }), {
      user: { role: "tester" } as any,
    });
    const res = await loader();
    expect(res.ok).toBe(true);
    expect(res.__abby_user).toEqual({ role: "tester" });
  });

  it("supports enableCookies, disableCookies, and loadProjectData helpers", async () => {
    const removeSpy = vi.spyOn(TestStorageService, "remove");
    const {
      enableCookies,
      disableCookies,
      loadProjectData,
      __abby__,
    } = createAbby({
      environments: ["prod"],
      currentEnvironment: "prod",
      projectId: "123",
      tests: {
        hero: { variants: ["A", "B"] },
      },
      cookies: {
        disableByDefault: true,
      },
    });

    enableCookies();
    expect(__abby__.getConfig().cookies?.disableByDefault).toBe(false);

    disableCookies();
    expect(__abby__.getConfig().cookies?.disableByDefault).toBe(true);
    expect(removeSpy).toHaveBeenCalledWith("123", "hero");

    const data = await loadProjectData();
    expect(data).toBeDefined();
  });
});
