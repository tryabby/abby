import { mount } from "@vue/test-utils";
import { defineComponent, type ComputedRef } from "vue";
import { createAbby } from "../src";

const OLD_ENV = process.env;

beforeEach(() => {
  vi.resetModules();
  process.env = { ...OLD_ENV };
});

afterAll(() => {
  process.env = OLD_ENV;
});

function mountWithProvider(
  Provider: ReturnType<typeof createAbby>["AbbyProvider"],
  setup: () => Record<string, unknown>
) {
  const Child = defineComponent({
    name: "TestChild",
    setup,
    template: "<div />",
  });

  return mount(
    defineComponent({
      components: { Provider, Child },
      template: "<Provider><Child /></Provider>",
    })
  );
}

describe("useAbby", () => {
  it("returns the correct types", () => {
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

    let test1Variant: ComputedRef<"ONLY_ONE_VARIANT"> | undefined;
    let test2Variant: ComputedRef<(typeof test2Variants)[number]> | undefined;

    mountWithProvider(AbbyProvider, () => {
      test1Variant = useAbby("test").variant;
      test2Variant = useAbby("test2").variant;
      return {};
    });

    assertType<"ONLY_ONE_VARIANT">(test1Variant!.value);
    assertType<(typeof test2Variants)[number]>(test2Variant!.value);
    expect(test1Variant?.value).toBeDefined();
    expect(test2Variant?.value).toBeDefined();
  });
});

describe("useFeatureFlag", () => {
  it("returns the correct types", () => {
    const { AbbyProvider, useFeatureFlag } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      flags: ["test"],
    });

    let flag: ComputedRef<boolean> | undefined;
    mountWithProvider(AbbyProvider, () => {
      flag = useFeatureFlag("test");
      return {};
    });

    expectTypeOf(flag!.value).toEqualTypeOf<boolean>();
    expectTypeOf(useFeatureFlag).parameter(0).toEqualTypeOf<"test">();
  });

  describe("getVariants", () => {
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
        settings: {
          flags: {
            devOverrides: {
              test: true,
            },
          },
        },
      });
      expectTypeOf(getVariants("test")).toEqualTypeOf<
        readonly ["ONLY_ONE_VARIANT"]
      >();
    });
  });
});

describe("useRemoteConfig", () => {
  it("uses correct typings", () => {
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

    expectTypeOf(useRemoteConfig)
      .parameter(0)
      .toEqualTypeOf<"stringRc" | "numberRc" | "jsonRc">();

    let stringRc: ComputedRef<string> | undefined;
    let numberRc: ComputedRef<number> | undefined;
    let jsonRc: ComputedRef<Record<string, unknown>> | undefined;

    mountWithProvider(AbbyProvider, () => {
      stringRc = useRemoteConfig("stringRc");
      numberRc = useRemoteConfig("numberRc");
      jsonRc = useRemoteConfig("jsonRc");
      return {};
    });

    expectTypeOf(stringRc!.value).toEqualTypeOf<string>();
    expectTypeOf(numberRc!.value).toEqualTypeOf<number>();
    expectTypeOf(jsonRc!.value).toEqualTypeOf<Record<string, unknown>>();
  });
});
