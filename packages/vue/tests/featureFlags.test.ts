import { mount } from "@vue/test-utils";
import { type ComputedRef, defineComponent, h, nextTick } from "vue";
import { createAbby } from "../src";

const makeAbby = () =>
  createAbby({
    environments: [""],
    currentEnvironment: "",
    projectId: "123",
    flags: ["flag1", "flag2"],
    remoteConfig: { remoteConfig1: "String" },
  });

async function waitFor(check: () => boolean) {
  for (let i = 0; i < 50; i++) {
    if (check()) return;
    await new Promise((r) => setTimeout(r, 20));
    await nextTick();
  }
}

describe("useFeatureFlag", () => {
  it("updates once the project data is loaded", async () => {
    const { useFeatureFlag } = makeAbby();
    let flag!: ReturnType<typeof useFeatureFlag>;
    mount(
      defineComponent({
        setup() {
          flag = useFeatureFlag("flag1");
          return () => h("div", String(flag.value));
        },
      })
    );

    await waitFor(() => flag.value === true);
    expect(flag.value).toBe(true);
  });

  it("returns every flag with its name and value", async () => {
    const { useFeatureFlags } = makeAbby();
    let flags!: ReturnType<typeof useFeatureFlags>;
    mount(
      defineComponent({
        setup() {
          flags = useFeatureFlags();
          return () => h("div");
        },
      })
    );

    await waitFor(() => flags.value.some((f) => f.value === true));
    expect(flags.value).toEqual([
      { name: "flag1", value: true },
      { name: "flag2", value: false },
    ]);
  });
});

describe("useRemoteConfig", () => {
  it("returns the remote config value after loading", async () => {
    const { useRemoteConfig } = makeAbby();
    let value!: ComputedRef<unknown>;
    mount(
      defineComponent({
        setup() {
          value = useRemoteConfig("remoteConfig1");
          return () => h("div");
        },
      })
    );

    await waitFor(() => value.value === "FooBar");
    expect(value.value).toBe("FooBar");
  });
});

describe("getters", () => {
  it("getFeatureFlagValue returns the loaded value", async () => {
    const { getFeatureFlagValue, __abby__ } = makeAbby();
    await __abby__.loadProjectData();

    expect(getFeatureFlagValue("flag1")).toBe(true);
    expect(getFeatureFlagValue("flag2")).toBe(false);
  });
});

describe("abbyPlugin", () => {
  it("seeds the data from initialData without fetching", () => {
    const { abbyPlugin, getFeatureFlagValue } = makeAbby();
    abbyPlugin.install({} as any, {
      initialData: {
        tests: [],
        flags: [
          { name: "flag1", value: false },
          { name: "flag2", value: true },
        ],
        remoteConfig: [],
      },
    });

    expect(getFeatureFlagValue("flag2")).toBe(true);
  });
});
