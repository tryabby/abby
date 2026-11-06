import { AbbyEventType, HttpService } from "@tryabby/core";
import { flushPromises, mount } from "@vue/test-utils";
import { type ComputedRef, defineComponent, h } from "vue";
import { createAbby } from "../src";
import { TestStorageService } from "../src/StorageService";

const OLD_ENV = process.env;

beforeEach(() => {
  document.cookie.split(";").forEach((cookie) => {
    document.cookie = cookie
      .replace(/^ +/, "")
      .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
  });
  vi.restoreAllMocks();
  vi.resetModules();
  process.env = { ...OLD_ENV };
});

afterAll(() => {
  process.env = OLD_ENV;
});

type AbbyTestResult = {
  variant: ComputedRef<string>;
  onAct: () => void;
};

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

    let result!: AbbyTestResult;
    const Child = defineComponent({
      setup() {
        result = useAbby("test") as AbbyTestResult;
        return () => h("span", result.variant.value);
      },
    });

    mount(AbbyProvider, { slots: { default: () => h(Child) } });
    await flushPromises();

    expect(spy).toHaveBeenCalled();
    expect(result.variant.value).toBeDefined();
    expect(result.variant.value).not.toEqual("");
  });

  it("should use the persistedValue", async () => {
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

    let result!: AbbyTestResult;
    const Child = defineComponent({
      setup() {
        result = useAbby("test") as AbbyTestResult;
        return () => h("span", result.variant.value);
      },
    });

    mount(AbbyProvider, { slots: { default: () => h(Child) } });
    await flushPromises();

    expect(setSpy).not.toHaveBeenCalled();
    expect(result.variant.value).toEqual(persistedValue);
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

    let result!: AbbyTestResult;
    const Child = defineComponent({
      setup() {
        result = useAbby("test", {
          SimonsText: "a",
          MatthiasText: "b",
          TomsText: "c",
          TimsText: "d",
        }) as AbbyTestResult;
        return () => h("span", result.variant.value);
      },
    });

    mount(AbbyProvider, { slots: { default: () => h(Child) } });
    await flushPromises();

    expect(result.variant.value).toEqual("a");
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

    const Child = defineComponent({
      setup() {
        useAbby("test");
        return () => null;
      },
    });

    mount(AbbyProvider, { slots: { default: () => h(Child) } });
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

    let result!: AbbyTestResult;
    const Child = defineComponent({
      setup() {
        result = useAbby("test") as AbbyTestResult;
        return () => null;
      },
    });

    mount(AbbyProvider, { slots: { default: () => h(Child) } });
    await flushPromises();

    expect(spy).toHaveBeenCalledTimes(1);

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

    let flag1!: ComputedRef<boolean>;
    let flag2!: ComputedRef<boolean>;
    const Child = defineComponent({
      setup() {
        flag1 = useFeatureFlag("flag1");
        flag2 = useFeatureFlag("flag2");
        return () => null;
      },
    });

    mount(AbbyProvider, { slots: { default: () => h(Child) } });

    expect(flag1.value).toEqual(false);
    expect(flag2.value).toEqual(false);

    await flushPromises();

    expect(flag1.value).toEqual(true);
    expect(flag2.value).toEqual(false);
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

    let flag1!: ComputedRef<boolean>;
    let flag2!: ComputedRef<boolean>;
    const Child = defineComponent({
      setup() {
        flag1 = useFeatureFlag("flag1");
        flag2 = useFeatureFlag("flag2");
        return () => null;
      },
    });

    mount(AbbyProvider, { slots: { default: () => h(Child) } });

    expect(flag1.value).toEqual(false);
    expect(flag2.value).toEqual(true);

    await flushPromises();

    expect(flag1.value).toEqual(false);
    expect(flag2.value).toEqual(true);
  });

  it("gets the stored feature flag value using a function properly", async () => {
    const { AbbyVuePlugin, getFeatureFlagValue } = createAbby({
      environments: [],
      projectId: "123",
      flags: ["flag1", "flag2"],
      currentEnvironment: "a",
    });

    mount(defineComponent({ setup: () => () => null }), {
      global: { plugins: [AbbyVuePlugin] },
    });

    await flushPromises();

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

  it("returns correct remoteConfigValue", async () => {
    const { AbbyVuePlugin, useRemoteConfig } = createAbby({
      environments: [],
      projectId: "123",
      remoteConfig: {
        remoteConfig1: "String",
      },
      currentEnvironment: "a",
    });

    let remoteConfig!: ComputedRef<string>;
    mount(
      defineComponent({
        setup() {
          remoteConfig = useRemoteConfig("remoteConfig1");
          return () => null;
        },
      }),
      { global: { plugins: [AbbyVuePlugin] } }
    );

    await flushPromises();

    expect(remoteConfig.value).toEqual("FooBar");
  });

  it("uses defaultValues when remoteConfig is not set", async () => {
    const { AbbyVuePlugin, useRemoteConfig } = createAbby({
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

    let remoteConfig!: ComputedRef<string>;
    mount(
      defineComponent({
        setup() {
          remoteConfig = useRemoteConfig("unsetRemoteConfig");
          return () => null;
        },
      }),
      { global: { plugins: [AbbyVuePlugin] } }
    );

    await flushPromises();

    expect(remoteConfig.value).toEqual("defaultValue");
  });

  it("uses devOverride for remoteConfig", () => {
    process.env.NODE_ENV = "development";
    const { AbbyVuePlugin, useRemoteConfig } = createAbby({
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

    let remoteConfig!: ComputedRef<string>;
    mount(
      defineComponent({
        setup() {
          remoteConfig = useRemoteConfig("remoteConfig1");
          return () => null;
        },
      }),
      { global: { plugins: [AbbyVuePlugin] } }
    );

    expect(remoteConfig.value).toEqual("overwrittenValue");
  });

  it("isolates multiple createAbby instances", async () => {
    const instanceA = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "instance-a",
      tests: { test: { variants: ["A1", "A2"] } },
    });
    const instanceB = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "instance-b",
      tests: { test: { variants: ["B1", "B2"] } },
    });

    let result!: AbbyTestResult;
    const Child = defineComponent({
      setup() {
        result = instanceB.useAbby("test") as AbbyTestResult;
        return () => null;
      },
    });

    mount(Child, { global: { plugins: [instanceA.AbbyVuePlugin] } });
    await flushPromises();

    expect(["B1", "B2"]).toContain(result.variant.value);
  });

  it("works without a provider via the global singleton", async () => {
    const { useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "no-provider",
      tests: { test: { variants: ["GlobalA", "GlobalB"] } },
    });

    const { variant, onAct } = useAbby("test");
    expect(variant.value).toBeDefined();

    await flushPromises();

    expect(["GlobalA", "GlobalB"]).toContain(variant.value);
    expect(() => onAct()).not.toThrow();
  });
});

describe("useFeatureFlags()", () => {
  it("returns the correct list of feature flags", async () => {
    const { AbbyVuePlugin, useFeatureFlags } = createAbby({
      environments: [],
      currentEnvironment: "test",
      projectId: "123",
      flags: ["flag1"],
    });

    let flags!: ComputedRef<Array<{ name: string; value: boolean }>>;
    mount(
      defineComponent({
        setup() {
          flags = useFeatureFlags();
          return () => null;
        },
      }),
      { global: { plugins: [AbbyVuePlugin] } }
    );

    await flushPromises();

    expect(flags.value).toContainEqual({ name: "flag1", value: true });
  });
});

describe("useRemoteConfigVariables()", () => {
  it("returns the correct list of remote config variables", async () => {
    const { AbbyVuePlugin, useRemoteConfigVariables } = createAbby({
      environments: [],
      currentEnvironment: "test",
      projectId: "123",
      remoteConfig: {
        remoteConfig1: "String",
      },
    });

    let variables!: ComputedRef<Array<{ name: string; value: unknown }>>;
    mount(
      defineComponent({
        setup() {
          variables = useRemoteConfigVariables();
          return () => null;
        },
      }),
      { global: { plugins: [AbbyVuePlugin] } }
    );

    await flushPromises();

    expect(variables.value).toContainEqual({
      name: "remoteConfig1",
      value: expect.any(String),
    });
  });
});
