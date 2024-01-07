import { defineConfig } from "@tryabby/core";

export default defineConfig(
  {
    projectId: process.env["ABBY_PROJECT_ID"]!,
  },
  {
    environments: [],
    tests: {
      test1: {
        variants: ["A", "B", "C", "D"],
      },
      test2: {
        variants: ["A", "B"],
      },
    },
    flags: ["flag1"],
    remoteConfig: { flag2: "Number" },
  }
);

