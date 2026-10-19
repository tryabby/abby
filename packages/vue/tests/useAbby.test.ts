import { AbbyEventType, HttpService } from "@tryabby/core";
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
  it("returns the correct amount of options", () => {
    const spy = vi.spyOn(TestStorageService, "set");

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

    const result = useAbby("test");
    expect(spy).toHaveBeenCalled();
    expect(result.variant.value).toBeDefined();
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

    const result = useAbby("test");

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

    const { useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants },
      },
    });

    const result = useAbby("test", {
      SimonsText: "a",
      MatthiasText: "b",
      TomsText: "c",
      TimsText: "d",
    });

    expect(result.variant.value).toEqual("a");
  });

  it("should ping the current info on call", () => {
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

    const result = useAbby("test");
    result.onAct();

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: AbbyEventType.ACT })
    );
  });

  it("should respect the default values and devOverrides for feature flags", () => {
    process.env.NODE_ENV = "development";
    const { useFeatureFlag, useFeatureFlags } = createAbby({
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

    expect(useFeatureFlag("flag1").value).toEqual(false);
    expect(useFeatureFlag("flag2").value).toEqual(true);
    expect(useFeatureFlags().value).toEqual([
      { name: "flag1", value: false },
      { name: "flag2", value: true },
    ]);
  });

  it("uses defaultValues and devOverrides for remoteConfig", () => {
    const { useRemoteConfig, useRemoteConfigVariables } = createAbby({
      environments: [],
      projectId: "123",
      remoteConfig: {
        remoteConfig1: "String",
        unsetRemoteConfig: "String",
      },
      settings: {
        remoteConfig: {
          defaultValues: {
            String: "defaultValue",
          },
          devOverrides: {
            remoteConfig1: "overwrittenValue",
          },
        },
      },
      currentEnvironment: "a",
    });

    expect(useRemoteConfig("remoteConfig1").value).toEqual("overwrittenValue");
    expect(useRemoteConfig("unsetRemoteConfig").value).toEqual("defaultValue");
    expect(useRemoteConfigVariables().value).toHaveLength(2);
  });
});
