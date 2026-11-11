import { describe, expect, it } from "vitest";
import { createAbby, defineConfig } from "../src/index";

describe("@tryabby/vue runtime integration", () => {
  const config = defineConfig({
    projectId: "proj_vue_68",
    currentEnvironment: "production",
    environments: ["production", "development"],
    tests: {
      heroBanner: { variants: ["A", "B"] },
    },
    flags: ["darkMode"],
    remoteConfig: {
      maxItems: "number",
      welcomeBanner: "string",
    },
  });

  it("creates independent AbbyProvider and composables with selectedVariant & ACT reporting", () => {
    const abby = createAbby(config);
    expect(abby.AbbyProvider).toBeDefined();
    expect(typeof abby.useAbby).toBe("function");
    expect(typeof abby.useFeatureFlag).toBe("function");
    expect(typeof abby.useRemoteConfig).toBe("function");
  });
});
