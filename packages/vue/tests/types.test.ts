import { describe, expectTypeOf, it } from "vitest";
import { createAbby } from "../src";

const abby = createAbby({
  projectId: "test-project",
  currentEnvironment: "development",
  environments: ["development"],
  tests: {
    hero: { variants: ["control", "treatment"] as const },
  },
  flags: ["newNav"] as const,
});

describe("@tryabby/vue types", () => {
  it("keeps A/B test variants narrow", () => {
    const result = abby.useAbby("hero");
    expectTypeOf(result.variant.value).toEqualTypeOf<"control" | "treatment">();
    expectTypeOf(result.onAct).toEqualTypeOf<() => void>();
  });

  it("types feature flags", () => {
    expectTypeOf(abby.useFeatureFlag("newNav").value).toEqualTypeOf<boolean>();
  });

  it("exports a typed useRemoteConfig composable", () => {
    expectTypeOf(abby.useRemoteConfig).toBeFunction();
  });
});
