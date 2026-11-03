import { describe, expect, it } from "vitest";
import { createAbby } from "../createAbby";

describe("@tryabby/vue createAbby", () => {
  it("initializes createAbby with valid configuration", () => {
    const abby = createAbby({
      projectId: "test-project-123",
      currentEnvironment: "production",
      tests: {
        headlineTest: {
          variants: ["A", "B"],
        },
      },
      flags: ["newFeature"],
      remoteConfig: {
        bannerText: "String",
      },
    });

    expect(abby).toBeDefined();
    expect(abby.useAbby).toBeDefined();
    expect(abby.useFeatureFlag).toBeDefined();
    expect(abby.useRemoteConfig).toBeDefined();
    expect(abby.AbbyProvider).toBeDefined();
    expect(abby.AbbyPlugin).toBeDefined();
    expect(abby.getVariants("headlineTest")).toEqual(["A", "B"]);
  });

  it("returns getABResetFunction", () => {
    const abby = createAbby({
      projectId: "test-project-123",
      currentEnvironment: "production",
      tests: {
        headlineTest: {
          variants: ["A", "B"],
        },
      },
      flags: ["newFeature"],
      remoteConfig: {},
    });

    const resetFn = abby.getABResetFunction("headlineTest");
    expect(typeof resetFn).toBe("function");
    expect(() => resetFn()).not.toThrow();
  });
});
