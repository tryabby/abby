import { describe, expectTypeOf, it } from "vitest";
import type { ComputedRef } from "vue";
import { createAbby, defineConfig } from "../src/index";

describe("@tryabby/vue type inference", () => {
  const config = defineConfig({
    projectId: "proj_vue_types_68",
    currentEnvironment: "production",
    environments: ["production"],
    tests: {
      checkoutFlow: { variants: ["control", "streamlined"] },
    },
    flags: ["newSidebar"],
    remoteConfig: {
      retryCount: "number",
      greeting: "string",
    },
  });

  const { getABTestValue, getFeatureFlagValue, getRemoteConfig } = createAbby(config);

  it("infers variant union and lookup return types without explicit type arguments", () => {
    const rawVariant = getABTestValue("checkoutFlow");
    expectTypeOf(rawVariant).toEqualTypeOf<"control" | "streamlined">();

    const mapped = getABTestValue("checkoutFlow", {
      control: "Old Checkout",
      streamlined: "New Checkout",
    });
    expectTypeOf(mapped).toEqualTypeOf<string>();

    expectTypeOf(getFeatureFlagValue("newSidebar")).toEqualTypeOf<boolean>();
    expectTypeOf(getRemoteConfig("retryCount")).toEqualTypeOf<number>();
    expectTypeOf(getRemoteConfig("greeting")).toEqualTypeOf<string>();
  });
});
