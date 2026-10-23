import { describe, expectTypeOf, it } from "vitest";
import type { ComputedRef } from "vue";
import { createAbby } from "../src";

describe("Type Inference", () => {
  it("infers test variants correctly", () => {
    const { useAbby, getABTestValue } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "types_test",
      tests: {
        headerTest: { variants: ["VariantA", "VariantB"] },
      },
      flags: {
        enableFeature: "Boolean",
      },
      remoteConfig: {
        maxCount: "Number",
      },
    });

    const { variant } = useAbby("headerTest");
    expectTypeOf(variant).toEqualTypeOf<
      ComputedRef<"VariantA" | "VariantB">
    >();

    const direct = getABTestValue("headerTest");
    expectTypeOf(direct).toEqualTypeOf<"VariantA" | "VariantB">();
  });

  it("infers lookup object return types", () => {
    const { useAbby, getABTestValue } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "types_test",
      tests: {
        ctaTest: { variants: ["Primary", "Secondary"] },
      },
    });

    const { variant } = useAbby("ctaTest", {
      Primary: 100,
      Secondary: 200,
    });
    expectTypeOf(variant).toEqualTypeOf<ComputedRef<number>>();

    const mappedDirect = getABTestValue("ctaTest", {
      Primary: "text1",
      Secondary: "text2",
    });
    expectTypeOf(mappedDirect).toEqualTypeOf<"text1" | "text2">();
  });
});
