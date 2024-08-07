import { get } from "svelte/store";
import { createAbby } from "../lib/createAbby";
import { it, describe, expect } from "vitest";

describe("remoteConfig", () => {
  it("returns the correct remoteConfig value", async () => {
    const { useRemoteConfig, __abby__ } = createAbby({
      projectId: "123",
      remoteConfig: { remoteConfig1: "String" },
      environments: [""],
      currentEnvironment: "",
    });

    await __abby__.loadProjectData();

    const actual = get(useRemoteConfig("remoteConfig1"));
    expect(actual).toBe("FooBar");
  });

  it("uses the default values for remoteConfig", async () => {
    const { useRemoteConfig, __abby__ } = createAbby({
      projectId: "123",
      remoteConfig: { remoteConfig1: "String" },
      environments: [""],
      currentEnvironment: "",
      settings: {
        remoteConfig: {
          defaultValues: {
            String: "testDefaultValue",
          },
        },
      },
    });

    expect(get(useRemoteConfig("remoteConfig1"))).toBe("testDefaultValue");

    await __abby__.loadProjectData();
    expect(get(useRemoteConfig("remoteConfig1"))).toBe("FooBar");
  });

  it("uses the devOverrides", async () => {
    process.env.NODE_ENV = "development";
    const { useRemoteConfig, __abby__ } = createAbby({
      projectId: "123",
      currentEnvironment: "a",
      remoteConfig: { remoteConfig1: "String" },
      environments: [],
      settings: {
        remoteConfig: {
          devOverrides: {
            remoteConfig1: "devOverride",
          },
        },
      },
    });

    await __abby__.loadProjectData();
    expect(get(useRemoteConfig("remoteConfig1"))).toBe("devOverride");
  });
});
