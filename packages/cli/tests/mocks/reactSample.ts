import { createAbby } from "@tryabby/react";

const { AbbyProvider, useAbby } = createAbby({
    projectId: "test",
    tests: {
      test1: {
        variants: ["A", "B", "C", "D"],
      },
      test2: {
        variants: ["A", "B"],
      },
    },
    flags: ["flag1", "flag2"]
  });{
  projectId: "test",
  tests: {
    test1: {
      variants: [
        "A",
        "B",
        "C",
        "D"
      ]
    },
    test2: {
      variants: [
        "A",
        "B"
      ]
    },
    test3: {
      variants: [
        "A",
        "B",
        "C",
        "D"
      ]
    }
  },
  flags: [
    "flag1",
    "flag2",
    "flag3"
  ]
}