import type { ComputedRef } from "vue";
import { createAbby } from "../src";

const { useAbby, useFeatureFlag, useRemoteConfig, getABTestValue } = createAbby(
  {
    environments: [""],
    currentEnvironment: "",
    projectId: "123",
    flags: ["flag1"],
    tests: {
      footer: { variants: ["OldFooter", "NewFooter"] },
    },
    remoteConfig: {
      title: "String",
      limit: "Number",
      settings: "JSON",
    },
  }
);

describe("types", () => {
  it("useAbby returns a ref narrowed to the configured variants", () => {
    const { variant } = useAbby("footer");
    expectTypeOf(variant).toEqualTypeOf<
      ComputedRef<"OldFooter" | "NewFooter">
    >();
  });

  it("useAbby maps variants through the lookup object", () => {
    const { variant } = useAbby("footer", {
      OldFooter: "old",
      NewFooter: "new",
    } as const);
    expectTypeOf(variant).toEqualTypeOf<ComputedRef<"old" | "new">>();
  });

  it("useAbby only accepts configured test names", () => {
    // @ts-expect-error unknown test name
    useAbby("missing");
  });

  it("useFeatureFlag returns a boolean ref and only accepts configured flags", () => {
    expectTypeOf(useFeatureFlag("flag1")).toEqualTypeOf<ComputedRef<boolean>>();
    // @ts-expect-error unknown flag name
    useFeatureFlag("missing");
  });

  it("useRemoteConfig returns the type of the configured value", () => {
    expectTypeOf(useRemoteConfig("title")).toEqualTypeOf<ComputedRef<string>>();
    expectTypeOf(useRemoteConfig("limit")).toEqualTypeOf<ComputedRef<number>>();
  });

  it("getABTestValue returns the configured variants", () => {
    expectTypeOf(getABTestValue("footer")).toEqualTypeOf<
      "OldFooter" | "NewFooter"
    >();
  });
});
