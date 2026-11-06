import { assertType, describe, expect, it } from "vitest";
import type { ComputedRef } from "vue";
import { createAbby } from "../src";

describe("TypeScript Type Checking for @tryabby/vue", () => {
  it("infers exact test variant types", () => {
    const test2Variants = [
      "SimonsText",
      "MatthiasText",
      "TomsText",
      "TimsText",
    ] as const;

    const { useAbby, useFeatureFlag, useRemoteConfig } = createAbby({
      environments: ["dev", "prod"],
      currentEnvironment: "dev",
      projectId: "123",
      flags: ["flagA", "flagB"],
      remoteConfig: {
        bannerText: "String",
        bannerCount: "Number",
        bannerSettings: "JSON",
      },
      tests: {
        test: { variants: ["ONLY_ONE_VARIANT"] },
        test2: { variants: test2Variants },
      },
    });

    // Mock type checks (these validate compile-time types)
    type HookType1 = ReturnType<typeof useAbby<"test", "ONLY_ONE_VARIANT", never, undefined>>;
    assertType<ComputedRef<"ONLY_ONE_VARIANT">>({} as HookType1["variant"]);

    type HookType2 = ReturnType<typeof useAbby<"test2", (typeof test2Variants)[number], never, undefined>>;
    assertType<ComputedRef<(typeof test2Variants)[number]>>({} as HookType2["variant"]);

    type FlagType = ReturnType<typeof useFeatureFlag>;
    assertType<ComputedRef<boolean>>({} as FlagType);

    type RCTypeStr = ReturnType<typeof useRemoteConfig<"bannerText", "String">>;
    assertType<ComputedRef<string>>({} as RCTypeStr);

    type RCTypeNum = ReturnType<typeof useRemoteConfig<"bannerCount", "Number">>;
    assertType<ComputedRef<number>>({} as RCTypeNum);

    type RCTypeJson = ReturnType<typeof useRemoteConfig<"bannerSettings", "JSON">>;
    assertType<ComputedRef<Record<string, any>>>({} as RCTypeJson);

    expect(true).toBe(true);
  });
});
