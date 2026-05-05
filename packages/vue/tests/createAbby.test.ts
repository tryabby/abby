import { AbbyEventType, HttpService } from "@tryabby/core";
import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { createAbby } from "../src";
import { TestStorageService } from "../src/StorageService";

describe("createAbby Vue integration", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a reactive A/B test variant and onAct handler", () => {
    const { useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        headline: { variants: ["A", "B"] as const },
      },
    });

    const { variant, onAct } = useAbby("headline");

    expect(["A", "B"]).toContain(variant.value);
    expect(onAct).toBeDefined();
  });

  it("uses persisted A/B test values", () => {
    const getSpy = vi.spyOn(TestStorageService, "get");
    const setSpy = vi.spyOn(TestStorageService, "set");
    getSpy.mockReturnValue("B");

    const { useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        headline: { variants: ["A", "B"] as const },
      },
    });

    const { variant } = useAbby("headline");

    expect(getSpy).toHaveBeenCalled();
    expect(setSpy).not.toHaveBeenCalled();
    expect(variant.value).toBe("B");
  });

  it("maps variants through a lookup object", () => {
    vi.spyOn(TestStorageService, "get").mockReturnValue("B");
    const { useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        headline: { variants: ["A", "B"] as const },
      },
    });

    const { variant } = useAbby("headline", {
      A: "Control",
      B: "Treatment",
    });

    expect(variant.value).toBe("Treatment");
    expectTypeOf(variant.value).toEqualTypeOf<"Control" | "Treatment">();
  });

  it("returns reactive feature flags with local values", () => {
    const { useFeatureFlag, getFeatureFlagValue } = createAbby({
      environments: [],
      currentEnvironment: "production",
      projectId: "123",
      flags: ["beta"],
      settings: {
        flags: {
          defaultValue: true,
        },
      },
    });

    expect(useFeatureFlag("beta").value).toBe(false);
    expect(getFeatureFlagValue("beta")).toBe(false);
  });

  it("returns reactive remote config values", () => {
    const { useRemoteConfig, getRemoteConfig } = createAbby({
      environments: ["production"],
      currentEnvironment: "production",
      projectId: "123",
      remoteConfig: {
        theme: "String",
      },
      settings: {
        remoteConfig: {
          defaultValues: {
            String: "dark",
          },
        },
      },
    });

    expect(useRemoteConfig("theme").value).toBe("dark");
    expect(getRemoteConfig("theme")).toBe("dark");
  });

  it("sends ping and act events", () => {
    const spy = vi.spyOn(HttpService, "sendData");
    const { useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        checkout: { variants: ["A", "B"] as const },
      },
    });

    const { onAct } = useAbby("checkout");
    onAct();

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: AbbyEventType.PING })
    );
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: AbbyEventType.ACT })
    );
  });

  it("exposes sync helper functions", () => {
    const { getVariants, getABTestValue, getABResetFunction } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        color: { variants: ["red", "blue"] as const },
      },
    });

    expect(getVariants("color")).toEqual(["red", "blue"]);
    expect(["red", "blue"]).toContain(getABTestValue("color"));
    expect(getABResetFunction("color")).toEqual(expect.any(Function));
  });
});
