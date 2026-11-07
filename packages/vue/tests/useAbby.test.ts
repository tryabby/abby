import { AbbyEventType, HttpService } from "@tryabby/core";
import { flushPromises } from "@vue/test-utils";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { createAbby } from "../src";
import { TestStorageService } from "../src/StorageService";
import { clearCookies, renderComposable } from "./helpers";

const OLD_ENV = process.env;

async function settle() {
  await flushPromises();
  await nextTick();
  await flushPromises();
}

beforeEach(() => {
  clearCookies();
  vi.restoreAllMocks();
  process.env = { ...OLD_ENV };
});

afterAll(() => {
  process.env = OLD_ENV;
});

describe("useAbby", () => {
  it("returns a valid variant and an onAct function", async () => {
    const setSpy = vi.spyOn(TestStorageService, "set");

    const { AbbyProvider, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["OldFooter", "NewFooter"] },
      },
    });

    const { result } = renderComposable(() => useAbby("test"), AbbyProvider);
    await settle();

    expect(setSpy).toHaveBeenCalled();
    expect(["OldFooter", "NewFooter"]).toContain(result.variant.value);
    expect(typeof result.onAct).toBe("function");
  });

  it("uses the persisted value", async () => {
    const persistedValue = "SimonsText";
    const getSpy = vi.spyOn(TestStorageService, "get");
    const setSpy = vi.spyOn(TestStorageService, "set");

    getSpy.mockReturnValue(persistedValue);

    const { AbbyProvider, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["SimonsText", "MatthiasText"] },
      },
    });

    const { result } = renderComposable(() => useAbby("test"), AbbyProvider);
    await settle();

    // the stored value should not be overwritten
    expect(setSpy).not.toHaveBeenCalled();
    expect(getSpy).toHaveBeenCalled();
    expect(result.variant.value).toBe(persistedValue);
  });

  it("looks up the selected variant in the lookup object", async () => {
    const persistedValue = "SimonsText";
    const variants = ["SimonsText", "MatthiasText"] as const;

    vi.spyOn(TestStorageService, "get").mockReturnValue(persistedValue);

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
        }),
      AbbyProvider
    );
    await settle();

    expect(result.variant.value).toBe("a");
  });

  it("pings the current variant on mount", async () => {
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
    await settle();

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: AbbyEventType.PING })
    );
  });

  it("notifies the server with onAct", async () => {
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
    await settle();

    result.onAct();

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: AbbyEventType.ACT })
    );
  });

  it("returns the variants of a test", () => {
    const { getVariants } = createAbby({
      environments: [],
      projectId: "123",
      currentEnvironment: "a",
      tests: {
        test: { variants: ["A", "B", "C"] },
      },
    });

    expect(getVariants("test")).toEqual(["A", "B", "C"]);
  });

  it("uses the lookup object when retrieving a variant synchronously", () => {
    const { getABTestValue } = createAbby({
      environments: [],
      projectId: "123",
      currentEnvironment: "a",
      tests: {
        test: { variants: ["A", "B", "C"] },
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
});

describe("useFeatureFlag", () => {
  it("returns the fetched feature flag value", async () => {
    const { AbbyProvider, useFeatureFlag } = createAbby({
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

    expect(flag1.value).toBe(false);
    expect(flag2.value).toBe(false);

    await settle();

    expect(flag1.value).toBe(true);
    expect(flag2.value).toBe(false);
  });

  it("falls back to false for flags that are not returned by the server", async () => {
    const { AbbyProvider, useFeatureFlag } = createAbby({
      environments: [],
      projectId: "123",
      flags: ["unknownFlag"],
      currentEnvironment: "a",
    });

    const { result } = renderComposable(
      () => useFeatureFlag("unknownFlag"),
      AbbyProvider
    );

    expect(result.value).toBe(false);
    await settle();
    expect(result.value).toBe(false);
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

    const { result: flag1 } = renderComposable(
      () => useFeatureFlag("flag1"),
      AbbyProvider
    );
    const { result: flag2 } = renderComposable(
      () => useFeatureFlag("flag2"),
      AbbyProvider
    );

    expect(flag1.value).toBe(false);
    expect(flag2.value).toBe(true);

    await settle();

    expect(flag1.value).toBe(false);
    expect(flag2.value).toBe(true);
  });

  it("gets the stored feature flag value with a function", async () => {
    const { getFeatureFlagValue, __abby__ } = createAbby({
      environments: [],
      projectId: "123",
      flags: ["flag1", "flag2"],
      currentEnvironment: "a",
    });

    await __abby__.loadProjectData();

    expect(getFeatureFlagValue("flag1")).toBe(true);
    expect(getFeatureFlagValue("flag2")).toBe(false);
  });

  it("returns the list of feature flags", async () => {
    const { AbbyProvider, useFeatureFlags } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      flags: ["flag1", "flag2"],
    });

    const { result } = renderComposable(() => useFeatureFlags(), AbbyProvider);
    expect(result.value).toHaveLength(2);

    await settle();

    expect(result.value).toEqual([
      { name: "flag1", value: true },
      { name: "flag2", value: false },
    ]);
  });
});

describe("useRemoteConfig", () => {
  it("returns the fetched remote config value", async () => {
    const { AbbyProvider, useRemoteConfig } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      remoteConfig: {
        remoteConfig1: "String",
      },
    });

    const { result } = renderComposable(
      () => useRemoteConfig("remoteConfig1"),
      AbbyProvider
    );

    await settle();

    expect(result.value).toBe("FooBar");
  });

  it("uses the default value when remote config is not set", async () => {
    const { AbbyProvider, useRemoteConfig } = createAbby({
      environments: [""],
      currentEnvironment: "",
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
    });

    const { result } = renderComposable(
      () => useRemoteConfig("unsetRemoteConfig"),
      AbbyProvider
    );

    expect(result.value).toBe("defaultValue");
  });

  it("uses the devOverride", () => {
    process.env.NODE_ENV = "development";

    const { AbbyProvider, useRemoteConfig } = createAbby({
      environments: [""],
      currentEnvironment: "",
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
    });

    const { result } = renderComposable(
      () => useRemoteConfig("remoteConfig1"),
      AbbyProvider
    );

    expect(result.value).toBe("overwrittenValue");
  });

  it("returns the list of remote config variables", async () => {
    const { AbbyProvider, useRemoteConfigVariables } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      remoteConfig: {
        remoteConfig1: "String",
      },
    });

    const { result } = renderComposable(
      () => useRemoteConfigVariables(),
      AbbyProvider
    );
    expect(result.value).toHaveLength(1);

    await settle();

    expect(result.value).toEqual([{ name: "remoteConfig1", value: "FooBar" }]);
  });
});
