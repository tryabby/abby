import { AbbyEventType, HttpService } from "@tryabby/core";
import { describe, expect, it, vi } from "vitest";
import { createAbby } from "../src";
import { TestStorageService } from "../src/StorageService";

const OLD_ENV = process.env;

beforeEach(() => {
  document.cookie = "";
  vi.resetModules();
  process.env = { ...OLD_ENV };
});

afterAll(() => {
  process.env = OLD_ENV;
});

describe("useAbby", () => {
  it("returns a valid variant and onAct", () => {
    const { useAbby } = createAbby({
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

    const { variant, onAct } = useAbby("test");
    expect(variant.value).toBeDefined();
    expect(onAct).toBeDefined();
  });

  it("should use the persistedValue", () => {
    const persistedValue = "SimonsText";
    const variants = ["SimonsText", "MatthiasText", "TomsText", "TimsText"];

    const getSpy = vi.spyOn(TestStorageService, "get");
    const setSpy = vi.spyOn(TestStorageService, "set");

    getSpy.mockReturnValue(persistedValue);

    const { useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants },
      },
    });

    const { variant } = useAbby("test");

    // the stored value should not be overwritten
    expect(setSpy).not.toHaveBeenCalled();
    // value retrieved from storage
    expect(variant.value).toEqual(persistedValue);
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

    const { useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants },
      },
    });

    const { variant } = useAbby("test", {
      SimonsText: "a",
      MatthiasText: "b",
      TomsText: "c",
      TimsText: "d",
    });

    expect(variant.value).toEqual("a");
  });

  it("should ping the current info on mount", () => {
    const spy = vi.spyOn(HttpService, "sendData");

    const { useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["A", "B", "C"] },
      },
    });

    useAbby("test");

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: AbbyEventType.PING })
    );
  });

  it("should notify the server with onAct", () => {
    const spy = vi.spyOn(HttpService, "sendData");

    const { useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["A", "B", "C"] },
      },
    });

    const { onAct } = useAbby("test");
    onAct();

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: AbbyEventType.ACT })
    );
  });

  it("returns the correct possible variant values", () => {
    const { getVariants } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: {
          variants: ["SimonsText", "MatthiasText", "TomsText", "TimsText"],
        },
      },
    });

    expect(getVariants("test")).toEqual([
      "SimonsText",
      "MatthiasText",
      "TomsText",
      "TimsText",
    ]);
  });

  it("uses lookup object when retrieving variant", () => {
    const { getABTestValue } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        lookupTest: {
          variants: ["SimonsText", "MatthiasText", "TomsText", "TimsText"],
        },
      },
    });

    const pickedVariant = getABTestValue("lookupTest");
    const lookupMap = {
      SimonsText: 1,
      MatthiasText: 2,
      TomsText: 3,
      TimsText: 4,
    };

    const value = getABTestValue("lookupTest", lookupMap);
    expect(value).toBe(lookupMap[pickedVariant]);
  });
});

describe("useFeatureFlag", () => {
  it("should return the correct feature flag value", async () => {
    const { useFeatureFlag, __abby__ } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      flags: ["flag1", "flag2"],
    });

    await __abby__.loadProjectData();

    const flag1 = useFeatureFlag("flag1");
    expect(flag1.value).toEqual(true);

    const flag2 = useFeatureFlag("flag2");
    expect(flag2.value).toEqual(false);
  });

  it("should respect the default values for feature flags", () => {
    const { useFeatureFlag } = createAbby({
      environments: [],
      projectId: "123",
      flags: ["flag1"],
      currentEnvironment: "a",
      settings: {
        flags: {
          defaultValue: false,
        },
      },
    });

    const flag1 = useFeatureFlag("flag1");
    expect(flag1.value).toEqual(false);
  });

  it("uses the devOverrides", () => {
    process.env.NODE_ENV = "development";

    const { useFeatureFlag } = createAbby({
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

    const flag1 = useFeatureFlag("flag1");
    expect(flag1.value).toEqual(false);

    const flag2 = useFeatureFlag("flag2");
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
});

describe("useRemoteConfig", () => {
  it("returns the correct remoteConfig value", async () => {
    const { useRemoteConfig, __abby__ } = createAbby({
      projectId: "123",
      remoteConfig: { remoteConfig1: "String" },
      environments: [""],
      currentEnvironment: "",
    });

    await __abby__.loadProjectData();

    const remoteConfig1 = useRemoteConfig("remoteConfig1");
    expect(remoteConfig1.value).toBe("FooBar");
  });

  it("uses the default values for remoteConfig", () => {
    const { useRemoteConfig } = createAbby({
      projectId: "123",
      remoteConfig: { remoteConfig1: "String" },
      environments: [""],
      currentEnvironment: "",
      settings: {
        remoteConfig: {
          defaultValues: {
            String: "testDefaultValue",
          },
        },
      },
    });

    const remoteConfig1 = useRemoteConfig("remoteConfig1");
    expect(remoteConfig1.value).toBe("testDefaultValue");
  });

  it("uses the devOverrides", async () => {
    process.env.NODE_ENV = "development";

    const { useRemoteConfig, __abby__ } = createAbby({
      projectId: "123",
      currentEnvironment: "a",
      remoteConfig: { remoteConfig1: "String" },
      environments: [],
      settings: {
        remoteConfig: {
          devOverrides: {
            remoteConfig1: "devOverride",
          },
        },
      },
    });

    await __abby__.loadProjectData();

    const remoteConfig1 = useRemoteConfig("remoteConfig1");
    expect(remoteConfig1.value).toBe("devOverride");
  });
});

describe("types", () => {
  it("has the correct types for useAbby", () => {
    const { useAbby } = createAbby({
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

    const { variant } = useAbby("test");
    expectTypeOf(variant.value).toEqualTypeOf<"OldFooter" | "NewFooter">();
  });

  it("has the correct types for useFeatureFlag", () => {
    const { useFeatureFlag } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      flags: ["flag1"],
    });

    expectTypeOf(useFeatureFlag).parameters.toEqualTypeOf<["flag1"]>();

    const flag = useFeatureFlag("flag1");
    expectTypeOf(flag.value).toEqualTypeOf<boolean>();
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
});
