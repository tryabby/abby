import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { defineComponent, h } from "vue";
import { createAbby } from "../src";

describe("AbbyProvider & AbbyPlugin", () => {
  it("provides abby instance to children via AbbyProvider", () => {
    const { AbbyProvider, useAbby, __abby__ } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["A", "B"] },
      },
    });

    const ChildComponent = defineComponent({
      setup() {
        const { variant } = useAbby("test");
        return () => h("div", { id: "test-child" }, variant.value);
      },
    });

    const wrapper = mount(AbbyProvider, {
      slots: {
        default: () => h(ChildComponent),
      },
    });

    expect(wrapper.find("#test-child").text()).toMatch(/^(A|B)$/);
  });

  it("seeds initialData correctly in AbbyProvider", () => {
    const { AbbyProvider, useFeatureFlag } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      flags: ["flag1"],
    });

    const ChildComponent = defineComponent({
      setup() {
        const flag = useFeatureFlag("flag1");
        return () => h("div", { id: "flag-state" }, String(flag.value));
      },
    });

    const wrapper = mount(AbbyProvider, {
      props: {
        initialData: {
          tests: [],
          flags: [{ name: "flag1", value: true }],
          remoteConfig: [],
        },
      },
      slots: {
        default: () => h(ChildComponent),
      },
    });

    expect(wrapper.find("#flag-state").text()).toBe("true");
  });
});
