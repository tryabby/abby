import { describe, it, expect, vi, beforeEach } from "vitest";
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

    it("onAct can be called without throwing", () => {
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

      const { onAct } = useAbby("buttonColor");
      expect(() => onAct()).not.toThrow();
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
