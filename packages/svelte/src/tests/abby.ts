import { createAbby } from "../lib/createAbby";
export const abby = createAbby({
  environments: [],
  projectId: "123",
  currentEnvironment: process.env.NODE_ENV,
  tests: {
    "New Test3": {
      variants: ["A", "B"],
    },
  },
  flags: ["flag1"],
  remoteConfig: {
    remoteConfig1: "String",
  },
});
