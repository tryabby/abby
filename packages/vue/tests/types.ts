import { expectTypeOf } from "vitest";
import type { ComputedRef } from "vue";
import { makeAbby } from "./fixtures";

// Compiled by tsc; never executed outside a component's setup().
export function checkTypes() {
  const sdk = makeAbby();
  expectTypeOf(sdk.useFeatureFlag("premium")).toEqualTypeOf<
    ComputedRef<boolean>
  >();
  expectTypeOf(sdk.useRemoteConfig("title")).toEqualTypeOf<
    ComputedRef<string>
  >();
  expectTypeOf(sdk.useRemoteConfig("count")).toEqualTypeOf<
    ComputedRef<number>
  >();
  expectTypeOf(sdk.useRemoteConfig("theme")).toEqualTypeOf<
    ComputedRef<Record<string, unknown>>
  >();
  expectTypeOf(sdk.useAbby("button").variant).toEqualTypeOf<
    ComputedRef<"control" | "blue" | undefined>
  >();
  expectTypeOf(
    sdk.useAbby("button", { control: 1, blue: "two" }).variant
  ).toEqualTypeOf<ComputedRef<1 | "two" | undefined>>();
  expectTypeOf(sdk.getABTestValue("button")).toEqualTypeOf<
    "control" | "blue"
  >();
  expectTypeOf(sdk.getRemoteConfig("count")).toEqualTypeOf<number>();
  expectTypeOf(sdk.getVariants("button")).toEqualTypeOf<
    readonly ["control", "blue"]
  >();
  sdk.updateUserProperties({ role: "admin", age: 18, active: undefined });
  // @ts-expect-error Unknown feature flag
  sdk.useFeatureFlag("missing");
  // @ts-expect-error Unknown remote config
  sdk.useRemoteConfig("missing");
  // @ts-expect-error Unknown A/B test
  sdk.useAbby("missing");
  // @ts-expect-error Missing a variant in the lookup
  sdk.useAbby("button", { control: 1 });
  // @ts-expect-error Invalid user property type
  sdk.updateUserProperties({ age: "18" });
  // @ts-expect-error Unknown user property
  sdk.updateUserProperties({ missing: true });
}
