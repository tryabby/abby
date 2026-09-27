import { expectTypeOf } from "vitest";
import type { ComputedRef } from "vue";
import { createAbby } from "../src";

// Compiled by tsc, not executed as component setup.
function checkTypes() {
  const abby = createAbby({
    projectId: "types",
    environments: ["test"],
    currentEnvironment: "test",
    flags: ["banner", "checkout"],
    tests: { checkout: { variants: ["old", "new"] } },
    remoteConfig: { title: "String", limit: "Number", options: "JSON" },
    user: { age: { type: "number" }, name: { type: "string", optional: true } },
  });
  expectTypeOf(abby.useFeatureFlag("banner")).toEqualTypeOf<
    ComputedRef<boolean>
  >();
  expectTypeOf(abby.useRemoteConfig("title")).toEqualTypeOf<
    ComputedRef<string>
  >();
  expectTypeOf(abby.useRemoteConfig("limit")).toEqualTypeOf<
    ComputedRef<number>
  >();
  expectTypeOf(abby.useRemoteConfig("options")).toEqualTypeOf<
    ComputedRef<Record<string, unknown>>
  >();
  expectTypeOf(abby.useAbby("checkout").variant).toEqualTypeOf<
    ComputedRef<"old" | "new" | undefined>
  >();
  expectTypeOf(
    abby.useAbby("checkout", { old: 1, new: 2 }).variant
  ).toEqualTypeOf<ComputedRef<1 | 2 | undefined>>();
  expectTypeOf(
    abby.getABTestValue("checkout", { old: "A", new: "B" })
  ).toEqualTypeOf<"A" | "B">();
  expectTypeOf(abby.getRemoteConfig("limit")).toEqualTypeOf<number>();
  expectTypeOf(abby.getVariants("checkout")).toEqualTypeOf<
    readonly ["old", "new"]
  >();
  abby.updateUserProperties({ age: 30, name: undefined });
  const devtools = {
    create:
      (_props: {
        abby: typeof abby.__abby__;
        position?: "top-left" | "bottom-right";
      }) =>
      () => {},
  };
  abby.withDevtools(devtools, { position: "top-left" });
  // @ts-expect-error devtools options are inferred from the supplied factory
  abby.withDevtools(devtools, { position: "unknown" });
  // @ts-expect-error flag names come from configuration
  abby.useFeatureFlag("unknown");
  // @ts-expect-error remote config names come from configuration
  abby.useRemoteConfig("unknown");
  // @ts-expect-error test names come from configuration
  abby.useAbby("unknown");
  // @ts-expect-error all variants must have lookup entries
  abby.useAbby("checkout", { old: 1 });
  // @ts-expect-error returned refs are read-only
  abby.useFeatureFlag("banner").value = true;
  // @ts-expect-error targeting keeps validator types
  abby.updateUserProperties({ age: "30" });
  // @ts-expect-error helpers retain configured keys
  abby.getRemoteConfig("unknown");
}
void checkTypes;
