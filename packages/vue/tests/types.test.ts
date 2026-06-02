import { defineComponent, h } from "vue";
import { createAbby } from "../src";

describe("useAbby", () => {
  it("returns the correct types", () => {
    const variants = [
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
        test2: { variants },
      },
    });

    defineComponent({
      setup() {
        const test1Result = useAbby("test");
        const test2Result = useAbby("test2");

        assertType<"ONLY_ONE_VARIANT">(test1Result.variant.value);
        assertType<(typeof variants)[number]>(test2Result.variant.value);

        return () => h(AbbyProvider);
      },
    });
  });
});

describe("useFeatureFlag", () => {
  it("returns the correct types", () => {
    const { useFeatureFlag } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      flags: ["test"],
    });

    expectTypeOf(useFeatureFlag).parameter(0).toEqualTypeOf<"test">();

    defineComponent({
      setup() {
        const flag = useFeatureFlag("test");
        expectTypeOf(flag.value).toEqualTypeOf<boolean>();
        return () => null;
      },
    });
  });
});

describe("useRemoteConfig", () => {
  it("returns the correct types", () => {
    const { useRemoteConfig } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      remoteConfig: {
        stringRc: "String",
        numberRc: "Number",
        jsonRc: "JSON",
      },
    });

    expectTypeOf(useRemoteConfig)
      .parameter(0)
      .toEqualTypeOf<"stringRc" | "numberRc" | "jsonRc">();

    defineComponent({
      setup() {
        const stringRc = useRemoteConfig("stringRc");
        const numberRc = useRemoteConfig("numberRc");
        const jsonRc = useRemoteConfig("jsonRc");

        expectTypeOf(stringRc.value).toEqualTypeOf<string>();
        expectTypeOf(numberRc.value).toEqualTypeOf<number>();
        expectTypeOf(jsonRc.value).toEqualTypeOf<Record<string, unknown>>();
        return () => null;
      },
    });
  });
});
