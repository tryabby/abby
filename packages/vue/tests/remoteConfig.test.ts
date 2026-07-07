import { flushPromises } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { createAbby } from "../src";
import { withSetup } from "./utils";

const createInstance = () =>
  createAbby({
    environments: [""],
    currentEnvironment: "",
    projectId: "123",
    remoteConfig: { remoteConfig1: "String" },
  });

describe("useRemoteConfig", () => {
  it("returns the default value before the data is loaded", () => {
    const { useRemoteConfig } = createInstance();
    const { result } = withSetup(() => useRemoteConfig("remoteConfig1"));
    expect(result.value).toBe("");
  });

  it("reactively reflects the remote config value once the data loads", async () => {
    const instance = createInstance();
    const { result } = withSetup(() =>
      instance.useRemoteConfig("remoteConfig1")
    );

    await instance.__abby__.loadProjectData();
    await flushPromises();

    expect(result.value).toBe("FooBar");
  });
});

describe("getRemoteConfig", () => {
  it("returns the resolved remote config value", async () => {
    const instance = createInstance();
    await instance.__abby__.loadProjectData();
    expect(instance.getRemoteConfig("remoteConfig1")).toBe("FooBar");
  });
});
