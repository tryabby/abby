import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { createAbby } from "../src";

const OLD_ENV = process.env;

function renderComposable<T>(
  composable: () => T,
  Provider: ReturnType<typeof createAbby>["AbbyProvider"]
): { result: T } {
  let result!: T;

  const Child = defineComponent({
    setup() {
      result = composable();
      return () => h("div");
    },
  });

  const Root = defineComponent({
    setup() {
      return () => h(Provider, null, { default: () => h(Child) });
    },
  });

  mount(Root);
  return { result };
}

beforeEach(() => {
  vi.resetModules();
  process.env = { ...OLD_ENV };
});

afterAll(() => {
  process.env = OLD_ENV;
});

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

    const { result: test1Result } = renderComposable(
      () => useAbby("test"),
      AbbyProvider
    );

    assertType<"ONLY_ONE_VARIANT">(test1Result.variant.value);
    expect(test1Result.variant.value).toBeDefined();

    const { result: test2Result } = renderComposable(
      () => useAbby("test2"),
      AbbyProvider
    );

    assertType<(typeof test2Variants)[number]>(test2Result.variant.value);
    expect(test2Result.variant.value).toBeDefined();
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

    const { result: testFlagResult } = renderComposable(
      () => useFeatureFlag("test"),
      AbbyProvider
    );

    expectTypeOf(testFlagResult.value).toEqualTypeOf<boolean>();
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

    const { result: stringRcResult } = renderComposable(
      () => useRemoteConfig("stringRc"),
      AbbyProvider
    );
    const { result: numberRcResult } = renderComposable(
      () => useRemoteConfig("numberRc"),
      AbbyProvider
    );
    const { result: jsonRcResult } = renderComposable(
      () => useRemoteConfig("jsonRc"),
      AbbyProvider
    );

    expectTypeOf(stringRcResult.value).toEqualTypeOf<string>();
    expectTypeOf(numberRcResult.value).toEqualTypeOf<number>();
    expectTypeOf(jsonRcResult.value).toEqualTypeOf<Record<string, unknown>>();
  });
});
