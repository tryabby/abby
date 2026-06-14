import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { createAbby } from "../src";
import { TestStorageService } from "../src/StorageService";

beforeEach(() => {
  document.cookie = "";
});

describe("Vue SDK Wrapper", () => {
  it("returns correct default values and functions", () => {
    const { useAbby, useFeatureFlag } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["OldFooter", "NewFooter"] },
      },
      flags: ["flag1"],
    });

    const TestComponent = defineComponent({
      setup() {
        const { variant } = useAbby("test");
        const flag = useFeatureFlag("flag1");
        return () => h("div", { id: "test" }, `${variant.value}-${flag.value}`);
      },
    });

    const wrapper = mount(TestComponent);
    expect(wrapper.text()).toContain("OldFooter");
    expect(wrapper.text()).toContain("false");
  });

  it("handles lookup objects correctly", () => {
    const { useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["OldFooter", "NewFooter"] },
      },
    });

    const TestComponent = defineComponent({
      setup() {
        const { variant } = useAbby("test", {
          OldFooter: "OLD",
          NewFooter: "NEW",
        });
        return () => h("div", {}, variant.value);
      },
    });

    const wrapper = mount(TestComponent);
    expect(wrapper.text()).toBe("OLD");
  });

  it("should return the persisted value from Storage", () => {
    const getSpy = vi.spyOn(TestStorageService, "get");
    getSpy.mockReturnValue("NewFooter");

    const { useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["OldFooter", "NewFooter"] },
      },
    });

    const TestComponent = defineComponent({
      setup() {
        const { variant } = useAbby("test");
        return () => h("div", {}, variant.value);
      },
    });

    const wrapper = mount(TestComponent);
    expect(wrapper.text()).toBe("NewFooter");
    getSpy.mockRestore();
  });
});
