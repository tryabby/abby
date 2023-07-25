import { createAbby } from "./createAbby";

export const { getFeatureFlagValue, getABTestValue } = createAbby({
  projectId: "clfn3hs1t0002kx08x3kidi80",
  currentEnvironment: process.env.NODE_ENV,
  tests: {
    "New Test3": {
      variants: ["A", "B"],
    },
  },
  flags: {
    lol: "Boolean",
    test3: "Boolean",
    testAbby: "Boolean",
  },
  flagCacheConfig: {
    refetchFlags: true,
    timeToLive: 1,
  },
});

export const abby = { getFeatureFlagValue, getABTestValue };
