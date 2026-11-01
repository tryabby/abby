import type { ComputedRef } from "vue";
import { createAbby } from "../index";

const api = createAbby({
  projectId: "types",
  environments: ["production"],
  currentEnvironment: "production",
  tests: { heading: { variants: ["a", "b"] } },
  flags: ["banner"],
  remoteConfig: { title: "String", limit: "Number", options: "JSON" },
});

export function verifyPublicTypes() {
  const variant: ComputedRef<"a" | "b" | undefined> =
    api.useAbby("heading").variant;
  const mapped: ComputedRef<1 | 2 | undefined> = api.useAbby("heading", {
    a: 1,
    b: 2,
  }).variant;
  const flag: ComputedRef<boolean> = api.useFeatureFlag("banner");
  const title: ComputedRef<string> = api.useRemoteConfig("title");
  const limit: ComputedRef<number> = api.useRemoteConfig("limit");
  // @ts-expect-error Unknown flag names are rejected.
  api.useFeatureFlag("missing");
  // @ts-expect-error Unknown test names are rejected.
  api.useAbby("missing");
  // @ts-expect-error Lookup objects must cover all configured variants.
  api.useAbby("heading", { a: 1 });
  // @ts-expect-error Number remote configs are not strings.
  const wrong: ComputedRef<string> = api.useRemoteConfig("limit");
  return { variant, mapped, flag, title, limit, wrong };
}
