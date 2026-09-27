import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { createAbby } from "../src";

const abbyConfig = {
  environments: [""],
  currentEnvironment: "",
  projectId: "123",
  flags: ["flag1", "flag2", "flag3"],
  settings: { flags: { defaultValue: true } },
};

describe("useFeatureFlag", () => {
  it("returns the value of the feature flag", async () => {
    const { AbbyProvider, useFeatureFlag } = createAbby(abbyConfig);

    const Child = defineComponent({
      setup() {
        const flag1 = useFeatureFlag("flag1");
        const flag2 = useFeatureFlag("flag2");

        expectTypeOf(flag1.value).toEqualTypeOf<boolean>();

        return () => h("div", `${flag1.value}-${flag2.value}`);
      },
    });

    const wrapper = mount(AbbyProvider, {
      slots: { default: () => h(Child) },
    });

    await flushPromises();

    expect(wrapper.text()).toBe("true-false");
  });

  it("falls back to the default value for unknown flags", async () => {
    const { AbbyProvider, useFeatureFlag } = createAbby(abbyConfig);

    const Child = defineComponent({
      setup() {
        const flag3 = useFeatureFlag("flag3");

        return () => h("div", String(flag3.value));
      },
    });

    const wrapper = mount(AbbyProvider, {
      slots: { default: () => h(Child) },
    });

    await flushPromises();

    expect(wrapper.text()).toBe("true");
  });

  it("getFeatureFlagValue works outside of the reactivity system", () => {
    const { getFeatureFlagValue } = createAbby(abbyConfig);

    expect(getFeatureFlagValue("flag1")).toBeDefined();
  });
});

describe("useFeatureFlags", () => {
  it("returns all flags", async () => {
    const { AbbyProvider, useFeatureFlags } = createAbby(abbyConfig);

    const Child = defineComponent({
      setup() {
        const flags = useFeatureFlags();

        return () => h("div", flags.value.map((flag) => flag.name).join(","));
      },
    });

    const wrapper = mount(AbbyProvider, {
      slots: { default: () => h(Child) },
    });

    await flushPromises();

    expect(wrapper.text()).toBe("flag1,flag2");
  });
});
