import { describe, it, expectTypeOf } from "vitest";
import { defineComponent, h } from "vue";
import { mount, flushPromises } from "@vue/test-utils";
import { createAbby } from "../src";

describe("useAbby types", () => {
  it("returns the correct types", async () => {
    const test2Variants = [
      "SimonsText",
      "MatthiasText",
      "TomsText",
      "TimsText",
    ] as const;

    const { AbbyProvider, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["ONLY_ONE_VARIANT"] },
        test2: {
          variants: test2Variants,
        },
      },
    });

    const TestComponent = defineComponent({
      setup() {
        const { variant: test1Variant } = useAbby("test");
        const { variant: test2Variant } = useAbby("test2");

        expectTypeOf(test1Variant.value).toEqualTypeOf<"ONLY_ONE_VARIANT">();
        expectTypeOf(test2Variant.value).toEqualTypeOf<
          "SimonsText" | "MatthiasText" | "TomsText" | "TimsText"
        >();

        return { test1Variant, test2Variant };
      },
      render() {
        return h("div", `${this.test1Variant} ${this.test2Variant}`);
      },
    });

    mount(
      defineComponent({
        components: { AbbyProvider, TestComponent },
        template: `<AbbyProvider><TestComponent /></AbbyProvider>`,
      })
    );

    await flushPromises();
  });

  it("has the correct types with lookup object", async () => {
    const { AbbyProvider, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: {
          variants: ["A", "B", "C"],
        },
      },
    });

    const TestComponent = defineComponent({
      setup() {
        const { variant } = useAbby("test", {
          A: "Hello",
          B: "Bonjour",
          C: "Hola",
        });

        expectTypeOf(variant.value).toEqualTypeOf<
          "Hello" | "Bonjour" | "Hola"
        >();

        return { variant };
      },
      render() {
        return h("div", String(this.variant));
      },
    });

    mount(
      defineComponent({
        components: { AbbyProvider, TestComponent },
        template: `<AbbyProvider><TestComponent /></AbbyProvider>`,
      })
    );

    await flushPromises();
  });
});

describe("useFeatureFlag types", () => {
  it("returns the correct types", async () => {
    const { AbbyProvider, useFeatureFlag } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      flags: ["test"],
    });

    const TestComponent = defineComponent({
      setup() {
        const testFlag = useFeatureFlag("test");
        expectTypeOf(testFlag.value).toEqualTypeOf<boolean>();
        return { testFlag };
      },
      render() {
        return h("div", String(this.testFlag));
      },
    });

    mount(
      defineComponent({
        components: { AbbyProvider, TestComponent },
        template: `<AbbyProvider><TestComponent /></AbbyProvider>`,
      })
    );

    await flushPromises();
  });
});

describe("useRemoteConfig types", () => {
  it("uses correct typings", async () => {
    const { AbbyProvider, useRemoteConfig } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      remoteConfig: {
        stringRc: "String",
        numberRc: "Number",
        jsonRc: "JSON",
      },
    });

    // Type tests only - no render needed for type checking
    const TestComponent = defineComponent({
      setup() {
        const stringRc = useRemoteConfig("stringRc");
        const numberRc = useRemoteConfig("numberRc");
        const jsonRc = useRemoteConfig("jsonRc");

        expectTypeOf(stringRc.value).toEqualTypeOf<string>();
        expectTypeOf(numberRc.value).toEqualTypeOf<number>();
        expectTypeOf(jsonRc.value).toEqualTypeOf<Record<string, unknown>>();

        return {};
      },
      render() {
        return h("div", "type test");
      },
    });

    mount(
      defineComponent({
        components: { AbbyProvider, TestComponent },
        template: `<AbbyProvider><TestComponent /></AbbyProvider>`,
      })
    );

    // This test validates types at compile time, not runtime values
    await flushPromises();
  });
});

describe("getVariants types", () => {
  it("has the correct types", () => {
    const { getVariants } = createAbby({
      environments: [],
      projectId: "123",
      currentEnvironment: "test",
      tests: {
        test: {
          variants: ["ONLY_ONE_VARIANT"],
        },
      },
      flags: ["test"],
    });

    expectTypeOf(getVariants("test")).toEqualTypeOf<
      readonly ["ONLY_ONE_VARIANT"]
    >();
  });
});

describe("getABTestValue types", () => {
  it("produces proper types with a lookup object", () => {
    const { getABTestValue } = createAbby({
      environments: [],
      projectId: "123",
      currentEnvironment: "a",
      tests: {
        test: {
          variants: ["A", "B", "C"],
        },
      },
    });

    const activeVariant = getABTestValue("test", {
      A: "Hello",
      B: "Bonjour",
      C: "Hola",
    });

    expectTypeOf(activeVariant).toEqualTypeOf<"Hello" | "Bonjour" | "Hola">();
  });
});
