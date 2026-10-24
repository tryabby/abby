import { createAbby, defineConfig } from "@tryabby/vue";
import type { ComputedRef } from "vue";

// These checks resolve the published declaration entry, not src/index.ts.
export function declarationConsumer() {
  const sdk = createAbby(
    defineConfig(
      { projectId: "consumer", currentEnvironment: "test" },
      {
        environments: ["test"],
        tests: { checkout: { variants: ["a", "b"] } },
        flags: ["premium"],
        remoteConfig: { price: "Number" },
      }
    )
  );
  const price: ComputedRef<number> = sdk.useRemoteConfig("price");
  const variant: ComputedRef<"a" | "b" | undefined> =
    sdk.useAbby("checkout").variant;
  // @ts-expect-error Published declarations must reject unknown flags.
  sdk.useFeatureFlag("typo");
  // @ts-expect-error Published declarations must reject incomplete lookups.
  sdk.getABTestValue("checkout", { a: 1 });
  return { price, variant };
}
