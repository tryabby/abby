import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { createAbby } from "../src";

const test2Variants = [
  "SimonsText",
  "MatthiasText",
  "TomsText",
  "TimsText",
] as const;

const { AbbyProvider, useAbby, useFeatureFlag, useRemoteConfig } = createAbby({
  environments: [""],
  currentEnvironment: "",
  projectId: "123",
  flags: ["flag1"],
  tests: {
    test: { variants: ["ONLY_ONE_VARIANT"] },
    test2: {
      variants: test2Variants,
    },
  },
  remoteConfig: {
    stringConfig: "String",
    numberConfig: "Number",
    jsonConfig: "JSON",
  },
});

describe("types", () => {
  it("infers the variant types of the tests", () => {
    const Child = defineComponent({
      setup() {
        const test = useAbby("test");
        const test2 = useAbby("test2");
        expectTypeOf(test.variant.value).toEqualTypeOf<"ONLY_ONE_VARIANT">();
        expectTypeOf(test2.variant.value).toEqualTypeOf<
          (typeof test2Variants)[number]
        >();

        return () => h("div");
      },
    });

    const wrapper = mount(AbbyProvider, {
      slots: { default: () => h(Child) },
    });

    expect(wrapper.text()).toBe("");
  });

  it("infers the flag and remote config types", () => {
    const Child = defineComponent({
      setup() {
        const flag = useFeatureFlag("flag1");
        const stringConfig = useRemoteConfig("stringConfig");
        const numberConfig = useRemoteConfig("numberConfig");
        const jsonConfig = useRemoteConfig("jsonConfig");

        expectTypeOf(flag.value).toEqualTypeOf<boolean>();
        expectTypeOf(stringConfig.value).toEqualTypeOf<string>();
        expectTypeOf(numberConfig.value).toEqualTypeOf<number>();
        expectTypeOf(jsonConfig.value).toEqualTypeOf<Record<string, unknown>>();

        return () => h("div");
      },
    });

    const wrapper = mount(AbbyProvider, {
      slots: { default: () => h(Child) },
    });

    expect(wrapper.text()).toBe("");
  });
});
