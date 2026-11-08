import { describe, expect, it } from "vitest";
import { createAbby } from "../src";

describe("@tryabby/vue runtime", () => {
  it("creates composables backed by @tryabby/core", () => {
    const abby = createAbby({
      projectId: "test-project",
      currentEnvironment: "development",
      environments: ["development"],
      tests: {
        hero: { variants: ["control", "treatment"] as const },
      },
      flags: ["newNav"] as const,
      remoteConfig: {
        headline: "string",
      } as const,
      settings: {
        flags: { defaultValue: false },
        remoteConfig: { defaultValues: { string: "hello" } },
      },
    });

    expect(abby.useFeatureFlag("newNav").value).toBe(false);
    expect(abby.useRemoteConfig("headline").value).toBe("hello");
    expect(abby.useAbby("hero").variant.value).toMatch(/control|treatment/);
  });
});
