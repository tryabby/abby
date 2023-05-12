import { createAbby } from "./createAbby";

export const abby = createAbby({
  projectId: "clgxq81ec0000mj08c58hdxkl",
  currentEnvironment: process.env.NODE_ENV,
  tests: {
    "New Test3": {
      variants: ["A", "B"],
    },
  },
  flags: ["lol", "test3"],
});
