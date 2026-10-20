import { describe, expectTypeOf, it } from "vitest";
import type { ComputedRef } from "vue";
import { createAbby } from "../src";

describe("TypeScript Type Checking", () => {
  it("useAbby has strict variant types", () => {
    const test2Variants = [
      "SimonsText",
      "MatthiasText",
      "TomsText",
      "TimsText",
    ] as const;

    const { useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["ONLY_ONE_VARIANT"] },
        test2: {
          variants: test2Variants,
        },
      },
    });

    const res1 = useAbby("test");
    expectTypeOf(res1.variant).toEqualTypeOf<ComputedRef<"ONLY_ONE_VARIANT">>();

    const res2 = useAbby("test2");
    expectTypeOf(res2.variant).toEqualTypeOf<
      ComputedRef<(typeof test2Variants)[number]>
    >();

    const resLookup = useAbby("test2", {
      SimonsText: 1,
      MatthiasText: 2,
      TomsText: 3,
      TimsText: 4,
    });
    expectTypeOf(resLookup.variant).toEqualTypeOf<ComputedRef<number>>();
  });

  it("useFeatureFlag has strictly typed flag names and boolean return", () => {
    const { useFeatureFlag } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      flags: ["flagA", "flagB"],
    });

    const flagA = useFeatureFlag("flagA");
    expectTypeOf(flagA).toEqualTypeOf<ComputedRef<boolean>>();
    expectTypeOf(useFeatureFlag)
      .parameter(0)
      .toEqualTypeOf<"flagA" | "flagB">();
  });

  it("useRemoteConfig infers correct typescript types from RemoteConfig schema", () => {
    const { useRemoteConfig } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      remoteConfig: {
        stringKey: "String",
        numberKey: "Number",
        jsonKey: "JSON",
      },
    });

    const str = useRemoteConfig("stringKey");
    expectTypeOf(str).toEqualTypeOf<ComputedRef<string>>();

    const num = useRemoteConfig("numberKey");
    expectTypeOf(num).toEqualTypeOf<ComputedRef<number>>();

    const json = useRemoteConfig("jsonKey");
    expectTypeOf(json).toEqualTypeOf<ComputedRef<Record<string, any>>>();
  });
});
