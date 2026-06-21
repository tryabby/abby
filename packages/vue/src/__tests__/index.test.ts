import { describe, it, expect, expectTypeOf, vi, beforeEach } from "vitest";
import { AbbyEventType, HttpService } from "@tryabby/core";
import { createAbby } from "../index";

vi.mock("@tryabby/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tryabby/core")>();
  return {
    ...actual,
  };
});

describe("createAbby", () => {
  it("returns the expected API surface", () => {
    const { AbbyPlugin, useAbby, useFeatureFlag, useRemoteConfig, __abby__ } =
      createAbby({
        projectId: "test-project",
        environments: [],
        currentEnvironment: "",
        tests: {
          buttonColor: { variants: ["blue", "red"] },
        },
        flags: ["darkMode"],
        remoteConfig: {},
        settings: {
          flags: {
            devOverrides: {},
          },
        },
      });

    expect(typeof AbbyPlugin).toBe("function");
    expect(typeof useAbby).toBe("function");
    expect(typeof useFeatureFlag).toBe("function");
    expect(typeof useRemoteConfig).toBe("function");
    expect(__abby__).toBeDefined();
  });

  describe("useFeatureFlag", () => {
    it("returns a ref with the feature flag value", () => {
      const { useFeatureFlag } = createAbby({
        projectId: "test-project",
        environments: [],
        currentEnvironment: "",
        tests: {},
        flags: ["darkMode"],
        remoteConfig: {},
        settings: {
          flags: {
            defaultValue: false,
            devOverrides: {},
          },
        },
      });

      const flag = useFeatureFlag("darkMode");
      expect(flag).toHaveProperty("value");
      expect(typeof flag.value).toBe("boolean");
    });
  });

  describe("useAbby", () => {
    it("returns variant ref and onAct function", () => {
      const { useAbby } = createAbby({
        projectId: "test-project",
        environments: [],
        currentEnvironment: "",
        tests: {
          buttonColor: { variants: ["blue", "red"] },
        },
        flags: [],
        remoteConfig: {},
      });

      const { variant, onAct } = useAbby("buttonColor");
      expect(variant).toHaveProperty("value");
      expect(["blue", "red"]).toContain(variant.value);
      expect(typeof onAct).toBe("function");
    });

    it("onAct sends the correct ACT payload", () => {
      const sendDataSpy = vi
        .spyOn(HttpService, "sendData")
        .mockReturnValue(undefined as never);

      const { useAbby } = createAbby({
        projectId: "test-project",
        environments: [],
        currentEnvironment: "",
        tests: {
          buttonColor: { variants: ["blue", "red"] },
        },
        flags: [],
        remoteConfig: {},
      });

      const { variant, onAct } = useAbby("buttonColor");
      onAct();

      expect(sendDataSpy).toHaveBeenCalledTimes(1);
      const payload = sendDataSpy.mock.calls[0]![0];
      expect(payload.type).toBe(AbbyEventType.ACT);
      expect(payload.data).toMatchObject({
        projectId: "test-project",
        testName: "buttonColor",
        selectedVariant: variant.value,
      });

      sendDataSpy.mockRestore();
    });
  });

  describe("useRemoteConfig", () => {
    it("returns a ref with the remote config value (runtime + type)", () => {
      const { useRemoteConfig } = createAbby({
        projectId: "test-project",
        environments: [],
        currentEnvironment: "",
        tests: {},
        flags: [],
        remoteConfig: { theme: "String" },
        settings: {
          remoteConfig: {
            defaultValues: {
              String: "default-theme",
            },
          },
        },
      });

      const config = useRemoteConfig("theme");
      expect(config).toHaveProperty("value");
      expect(config.value).toBe("default-theme");
      // A "String" remote config resolves to a string-typed ref value.
      expectTypeOf(config.value).toBeString();
    });
  });

  describe("AbbyPlugin", () => {
    it("calls app.provide with the injection key", () => {
      const { AbbyPlugin } = createAbby({
        projectId: "test-project",
        environments: [],
        currentEnvironment: "",
        tests: {},
        flags: [],
        remoteConfig: {},
      });

      const providedValues: Array<[symbol, unknown]> = [];
      const fakeApp = {
        provide: (key: symbol, value: unknown) => {
          providedValues.push([key, value]);
        },
      };

      AbbyPlugin(fakeApp);
      expect(providedValues.length).toBe(1);
      expect(providedValues[0]?.[1]).toHaveProperty("abby");
    });
  });
});
