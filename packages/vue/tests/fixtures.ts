import type { AbbyDataResponse } from "@tryabby/core";
import { createAbby } from "../src";

export function createSdk() {
  return createAbby({
    projectId: "vue-test",
    currentEnvironment: "test",
    environments: ["test"],
    cookies: { disableByDefault: true },
    tests: { headline: { variants: ["control", "candidate"] } },
    flags: ["new-ui"],
    remoteConfig: { greeting: "String", count: "Number", layout: "JSON" },
    user: { age: { type: "number" }, name: { type: "string" } },
  });
}

export function projectData(enabled = false): AbbyDataResponse {
  return {
    tests: [{ name: "headline", weights: [1, 0] }],
    flags: [{ name: "new-ui", value: enabled }],
    remoteConfig: [
      { name: "greeting", value: "Hello" },
      { name: "count", value: 3 },
      { name: "layout", value: { columns: 2 } },
    ],
  };
}
