import { createAbby } from "@tryabby/svelte";

export const {
  useAbby,
  useFeatureFlag,
  useRemoteConfig,
  getFeatureFlagValue,
  getRemoteConfig,
  getABTestValue,
  getABResetFunction,
  getVariants,
  withAbby,
  AbbyProvider,
  __abby__,
} = createAbby({
  environments: ["production", "development"],
  projectId: "clfn3hs1t0002kx08x3kidi80",
  currentEnvironment: "production",
  tests: {
    ButtonColor: {
      variants: ["blue", "green", "red"],
    },
    Home: {
      variants: ["A", "B", "C"],
    },
  },
  flags: ["showBanner", "clientFlag", "serverFlag"],
  remoteConfig: {
    headline: "String",
    copyText: "String",
  },
});
