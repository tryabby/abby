import { expectTypeOf } from "vitest";
import type { ComputedRef } from "vue";
import { createSdk } from "./fixtures";

// This function is typechecked, never invoked outside Vue setup.
function typeAssertions() {
  const sdk = createSdk();
  expectTypeOf(sdk.useFeatureFlag("new-ui")).toEqualTypeOf<
    ComputedRef<boolean>
  >();
  expectTypeOf(sdk.useRemoteConfig("greeting")).toEqualTypeOf<
    ComputedRef<string>
  >();
  expectTypeOf(sdk.useRemoteConfig("count")).toEqualTypeOf<
    ComputedRef<number>
  >();
  expectTypeOf(sdk.useRemoteConfig("layout")).toEqualTypeOf<
    ComputedRef<Record<string, unknown>>
  >();
  expectTypeOf(sdk.useAbby("headline").variant).toEqualTypeOf<
    ComputedRef<"control" | "candidate" | undefined>
  >();
  expectTypeOf(
    sdk.useAbby("headline", { control: 1, candidate: 2 } as const).variant
  ).toEqualTypeOf<ComputedRef<1 | 2 | undefined>>();
  expectTypeOf(sdk.useAbby("headline").onAct).toEqualTypeOf<() => void>();
  // @ts-expect-error Only configured flag names are accepted.
  sdk.useFeatureFlag("missing");
  // @ts-expect-error Only configured remote-config keys are accepted.
  sdk.useRemoteConfig("missing");
  // @ts-expect-error Only configured experiments are accepted.
  sdk.useAbby("missing");
  // @ts-expect-error A lookup must cover every variant.
  sdk.useAbby("headline", { control: 1 });
  // @ts-expect-error Readonly computed refs cannot be assigned by consumers.
  sdk.useFeatureFlag("new-ui").value = true;
  // @ts-expect-error The configured property is a number.
  sdk.updateUserProperties({ age: "twenty-five" });
  // @ts-expect-error Unknown user properties cannot be supplied.
  sdk.updateUserProperties({ secret: "unconfigured" });
}

void typeAssertions;
