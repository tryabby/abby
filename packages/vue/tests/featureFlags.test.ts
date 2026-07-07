import { flushPromises } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { createAbby } from "../src";
import { withSetup } from "./utils";

const createInstance = () =>
  createAbby({
    environments: [""],
    currentEnvironment: "",
    projectId: "123",
    flags: ["flag1"],
  });

describe("useFeatureFlag", () => {
  it("returns the default value before the data is loaded", () => {
    const { useFeatureFlag } = createInstance();
    const { result } = withSetup(() => useFeatureFlag("flag1"));
    expect(result.value).toBe(false);
  });

  it("reactively reflects the flag value once the data loads", async () => {
    const instance = createInstance();
    const { result } = withSetup(() => instance.useFeatureFlag("flag1"));

    expect(result.value).toBe(false);

    await instance.__abby__.loadProjectData();
    await flushPromises();

    expect(result.value).toBe(true);
  });

  it("tears down its subscription when the scope is disposed", async () => {
    const instance = createInstance();
    const { result, wrapper } = withSetup(() =>
      instance.useFeatureFlag("flag1")
    );

    // unmounting disposes the effect scope -> onScopeDispose unsubscribes
    wrapper.unmount();

    await instance.__abby__.loadProjectData();
    await flushPromises();

    // the ref no longer tracks changes after the scope was cleaned up
    expect(result.value).toBe(false);
  });
});

describe("getFeatureFlagValue", () => {
  it("returns the resolved flag value", async () => {
    const instance = createInstance();
    await instance.__abby__.loadProjectData();
    expect(instance.getFeatureFlagValue("flag1")).toBe(true);
  });
});
