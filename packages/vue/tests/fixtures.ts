import type { AbbyDataResponse } from "@tryabby/core";
import * as v from "@tryabby/core/validation";
import { createAbby } from "../src";

export const config = {
  projectId: "vue-test",
  environments: ["test"],
  currentEnvironment: "test",
  tests: {
    button: { variants: ["control", "blue"] },
    other: { variants: ["one"] },
  },
  flags: ["premium", "search"],
  remoteConfig: { title: "String", count: "Number", theme: "JSON" },
  user: { role: v.string(), age: v.number(), active: v.optional(v.boolean()) },
} as const;

export const data: AbbyDataResponse = {
  tests: [
    { name: "button", weights: [0, 1] },
    { name: "other", weights: [1] },
  ],
  flags: [
    { name: "premium", value: true },
    { name: "search", value: false },
  ],
  remoteConfig: [
    { name: "title", value: "Hello Vue" },
    { name: "count", value: 7 },
    { name: "theme", value: { dark: true } },
  ],
};

export const makeAbby = () =>
  createAbby({
    ...config,
    environments: [...config.environments],
    flags: [...config.flags],
  });
