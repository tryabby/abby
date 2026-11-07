import { describe, it, expect } from "vitest";
import { createAbby, useAbby, useFeatureFlag, useRemoteConfig } from "../index";

describe("@tryabby/vue composables and plugin", () => {
  it("should export required Vue composables", () => {
    expect(typeof useAbby).toBe("function");
    expect(typeof useFeatureFlag).toBe("function");
    expect(typeof useRemoteConfig).toBe("function");
    expect(typeof createAbby).toBe("function");
  });

  it("should initialize createAbby and return scoped composables", () => {
    const abbyClient = createAbby({
      projectId: "test-project-123",
      apiUrl: "https://api.tryabby.com",
      flags: ["new_checkout"],
      tests: {
        headline_test: {
          variants: ["A", "B"],
        },
      },
      remoteConfig: {
        banner_text: "String",
      },
    });

    expect(abbyClient).toBeDefined();
    expect(typeof abbyClient.useAbby).toBe("function");
    expect(typeof abbyClient.useFeatureFlag).toBe("function");
    expect(typeof abbyClient.useRemoteConfig).toBe("function");
  });
});
