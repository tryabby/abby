import { expectTypeOf } from "vitest";
import { createAbby } from "../src";

const sdk = createAbby({
  projectId: "types",
  environments: ["development", "production"],
  currentEnvironment: "development",
  tests: {
    checkout: { variants: ["control", "streamlined"] },
  },
  flags: ["newNav"],
  remoteConfig: {
    headline: "String",
    maxItems: "Number",
    metadata: "JSON",
  },
});

test("preserves names, variants, lookup values, and remote-config types", () => {
  const checkTypes = () => {
    const experiment = sdk.useAbby("checkout");
    const mapped = sdk.useAbby("checkout", {
      control: "old",
      streamlined: "new",
    });
    const flag = sdk.useFeatureFlag("newNav");
    const headline = sdk.useRemoteConfig("headline");
    const maxItems = sdk.useRemoteConfig("maxItems");
    const metadata = sdk.useRemoteConfig("metadata");

    expectTypeOf(experiment.variant.value).toEqualTypeOf<
      "control" | "streamlined"
    >();
    expectTypeOf(mapped.variant.value).toEqualTypeOf<"old" | "new">();
    expectTypeOf(flag.value).toEqualTypeOf<boolean>();
    expectTypeOf(headline.value).toEqualTypeOf<string>();
    expectTypeOf(maxItems.value).toEqualTypeOf<number>();
    expectTypeOf(metadata.value).toEqualTypeOf<Record<string, unknown>>();

    // @ts-expect-error unknown test
    sdk.useAbby("missing");
    // @ts-expect-error unknown flag
    sdk.useFeatureFlag("missing");
    // @ts-expect-error unknown remote config
    sdk.useRemoteConfig("missing");
    // @ts-expect-error lookup must cover every variant
    sdk.useAbby("checkout", { control: "old" });
  };

  expectTypeOf(checkTypes).toBeFunction();
});
