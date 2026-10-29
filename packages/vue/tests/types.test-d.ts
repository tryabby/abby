import type { AbbyDataResponse } from "@tryabby/core";
import { type ComputedRef, createApp } from "vue";
import { createAbby } from "../src";

const { AbbyPlugin, useAbby, useFeatureFlag, useRemoteConfig, ...abby } =
  createAbby({
    projectId: "123",
    environments: ["production"],
    currentEnvironment: "production",
    tests: {
      test: { variants: ["ONLY_ONE_VARIANT"] },
      test2: { variants: ["A", "B"] },
    },
    flags: ["flag1"],
    remoteConfig: {
      text: "String",
      count: "Number",
      json: "JSON",
    },
  });

describe("useAbby", () => {
  it("returns the variants as a computed ref", () => {
    expectTypeOf(useAbby("test").variant).toEqualTypeOf<
      ComputedRef<"ONLY_ONE_VARIANT">
    >();
    expectTypeOf(useAbby("test2").variant).toEqualTypeOf<
      ComputedRef<"A" | "B">
    >();
    expectTypeOf(useAbby("test").onAct).toEqualTypeOf<() => void>();
  });

  it("uses the types of the lookup object", () => {
    expectTypeOf(useAbby("test2", { A: 1, B: 2 }).variant).toEqualTypeOf<
      ComputedRef<1 | 2>
    >();
  });

  it("rejects unknown tests and incomplete lookup objects", () => {
    // @ts-expect-error unknown test
    useAbby("unknown");
    // @ts-expect-error variant B is missing
    useAbby("test2", { A: 1 });
  });
});

describe("useFeatureFlag", () => {
  it("returns a boolean computed ref", () => {
    expectTypeOf(useFeatureFlag("flag1")).toEqualTypeOf<ComputedRef<boolean>>();
  });

  it("rejects unknown flags", () => {
    // @ts-expect-error unknown flag
    useFeatureFlag("unknown");
  });
});

describe("useRemoteConfig", () => {
  it("infers the type from the config", () => {
    expectTypeOf(useRemoteConfig("text")).toEqualTypeOf<ComputedRef<string>>();
    expectTypeOf(useRemoteConfig("count")).toEqualTypeOf<ComputedRef<number>>();
    expectTypeOf(useRemoteConfig("json")).toEqualTypeOf<
      ComputedRef<Record<string, unknown>>
    >();
  });

  it("rejects unknown remote config", () => {
    // @ts-expect-error unknown remote config
    useRemoteConfig("unknown");
  });
});

describe("helpers", () => {
  it("are typed like the composables", () => {
    expectTypeOf(abby.getFeatureFlagValue("flag1")).toEqualTypeOf<boolean>();
    expectTypeOf(abby.getRemoteConfig("count")).toEqualTypeOf<number>();
    expectTypeOf(abby.getABTestValue("test2")).toEqualTypeOf<"A" | "B">();
    expectTypeOf(
      abby.getABTestValue("test2", { A: "a", B: "b" })
    ).toEqualTypeOf<"a" | "b">();
    expectTypeOf(abby.useFeatureFlags().value).toEqualTypeOf<
      Array<{ name: "flag1"; value: boolean }>
    >();
    // @ts-expect-error unknown flag
    abby.getFeatureFlagValue("unknown");
  });
});

describe("AbbyPlugin", () => {
  it("can be installed with and without initial data", () => {
    const initialData = {} as AbbyDataResponse;
    createApp({}).use(AbbyPlugin);
    createApp({}).use(AbbyPlugin, { initialData });
    // @ts-expect-error wrong option type
    createApp({}).use(AbbyPlugin, { initialData: "nope" });
  });
});
