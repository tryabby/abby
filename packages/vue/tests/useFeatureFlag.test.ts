import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createAbby } from "../src";

const OLD_ENV = process.env;

beforeEach(() => {
  document.cookie = "";
  vi.resetModules();
  process.env = { ...OLD_ENV };
});

afterAll(() => {
  process.env = OLD_ENV;
});

describe("useFeatureFlag", () => {
  it("returns default boolean value (false) and updates to true when data loads", async () => {
    const { useFeatureFlag, __abby__ } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      flags: ["flag1", "flag2"],
    });

    const flag1 = useFeatureFlag("flag1");
    expect(flag1.value).toBe(false);

    await __abby__.loadProjectData();
    expect(flag1.value).toBe(true);
  });

  it("respects default fallback values from config", async () => {
    const { useFeatureFlag, __abby__ } = createAbby({
      environments: [],
      projectId: "123",
      flags: ["flag1"],
      currentEnvironment: "production",
      settings: {
        flags: {
          defaultValue: false,
        },
      },
    });

    const flag1 = useFeatureFlag("flag1");
    expect(flag1.value).toBe(false);

    await __abby__.loadProjectData();
    expect(flag1.value).toBe(true);
  });

  it("allows querying all feature flags via useFeatureFlags", async () => {
    const { useFeatureFlags, __abby__ } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      flags: ["flag1", "flag2"],
    });

    const flags = useFeatureFlags();
    expect(flags.value).toEqual([
      { name: "flag1", value: false },
      { name: "flag2", value: false },
    ]);

    await __abby__.loadProjectData();
    expect(flags.value).toEqual([
      { name: "flag1", value: true },
      { name: "flag2", value: false },
    ]);
  });

  it("getFeatureFlagValue returns current synchronous value", () => {
    const { getFeatureFlagValue } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      flags: ["flag1"],
    });

    expect(getFeatureFlagValue("flag1")).toBe(false);
  });
});
