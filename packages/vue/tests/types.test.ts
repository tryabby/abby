import { createApp, defineComponent, h } from "vue";
import { createAbby } from "../src";

describe("useAbby", () => {
  it("returns correct types", () => {
    const test2Variants = [
      "SimonsText",
      "MatthiasText",
      "TomsText",
      "TimsText",
    ] as const;

    const { AbbyPlugin, useAbby } = createAbby({
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

    const component = defineComponent({
      setup() {
        const test1Result = useAbby("test");
        const test2Result = useAbby("test2");

        assertType<"ONLY_ONE_VARIANT">(test1Result.variant.value);
        assertType<(typeof test2Variants)[number]>(test2Result.variant.value);

        return () => h("div");
      },
    });

    createApp(component).use(AbbyPlugin).mount(document.createElement("div"));
  });
});

describe("useFeatureFlag", () => {
  it("returns correct types", () => {
    const { AbbyPlugin, useFeatureFlag } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      flags: ["test"],
    });

    const component = defineComponent({
      setup() {
        const flagResult = useFeatureFlag("test");

        expectTypeOf(flagResult.value).toEqualTypeOf<boolean>();
        expectTypeOf(useFeatureFlag).parameter(0).toEqualTypeOf<"test">();

        return () => h("div");
      },
    });

    createApp(component).use(AbbyPlugin).mount(document.createElement("div"));
  });
});

describe("useRemoteConfig", () => {
  it("returns correct types", () => {
    const { AbbyPlugin, useRemoteConfig } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      remoteConfig: {
        stringRc: "String",
        numberRc: "Number",
        jsonRc: "JSON",
      },
    });

    const component = defineComponent({
      setup() {
        const stringRcResult = useRemoteConfig("stringRc");
        const numberRcResult = useRemoteConfig("numberRc");
        const jsonRcResult = useRemoteConfig("jsonRc");

        expectTypeOf(stringRcResult.value).toEqualTypeOf<string>();
        expectTypeOf(numberRcResult.value).toEqualTypeOf<number>();
        expectTypeOf(jsonRcResult.value).toEqualTypeOf<
          Record<string, unknown>
        >();

        return () => h("div");
      },
    });

    createApp(component).use(AbbyPlugin).mount(document.createElement("div"));
  });
});
