import { createAbby } from "./createAbby.ts";

export const { getFeatureFlagValue } = createAbby({
    projectId: "clfn3hs1t0002kx08x3kidi80",
    currentEnvironment: process.env.NODE_ENV,
    tests: {
        "New Test3": {
            variants: ["A", "B"],
        },
    },
    flags: ["lol", "test3", "testAbby"],
});
