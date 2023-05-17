import { createAbby } from "@tryabby/svelte";

export const { useAbby, AbbyProvider, useFeatureFlag, withAbby , __abby__} = createAbby({
  projectId: "clfn3hs1t0002kx08x3kidi80",
  currentEnvironment: process.env.NODE_ENV,
  tests: {
    "New Test3": {
      variants: ["A", "B"],
    },
  },
  flags: ["lol", "test3", "testAbby"],
});
