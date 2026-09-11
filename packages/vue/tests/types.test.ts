import { assertType, describe, expectTypeOf, it } from "vitest";
import type { ComputedRef } from "vue";
import { createAbby } from "../src";

describe("@tryabby/vue - Types", () => {
  it("infers exact variant types for useAbby", () => {
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

    const test1Result = useAbby("test");
    assertType<ComputedRef<"ONLY_ONE_VARIANT">>(test1Result.variant);

    const test2Result = useAbby("test2");
    assertType<ComputedRef<(typeof test2Variants)[number]>>(
      test2Result.variant
    );
  });

  it("infers lookup object return types", () => {
    const { useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["A", "B"] },
      },
    });

    const res = useAbby("test", {
      A: 100,
      B: 200,
    });

    assertType<ComputedRef<number>>(res.variant);
  });

  it("infers exact flag types for useFeatureFlag", () => {
    const { useFeatureFlag } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      flags: ["testFlag", "anotherFlag"],
    });

    const flagResult = useFeatureFlag("testFlag");
    assertType<ComputedRef<boolean>>(flagResult);
    expectTypeOf(useFeatureFlag)
      .parameter(0)
      .toEqualTypeOf<"testFlag" | "anotherFlag">();
  });

  it("infers exact remoteConfig types for useRemoteConfig", () => {
    const { useRemoteConfig } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      remoteConfig: {
        strConfig: "String",
        numConfig: "Number",
        jsonConfig: "JSON",
      },
    });

    expectTypeOf(useRemoteConfig)
      .parameter(0)
      .toEqualTypeOf<"strConfig" | "numConfig" | "jsonConfig">();

    const strRes = useRemoteConfig("strConfig");
    assertType<ComputedRef<string>>(strRes);

    const numRes = useRemoteConfig("numConfig");
    assertType<ComputedRef<number>>(numRes);

    const jsonRes = useRemoteConfig("jsonConfig");
    assertType<ComputedRef<Record<string, unknown>>>(jsonRes);
  });
});
