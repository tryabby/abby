import { mount } from "@vue/test-utils";
import {
  afterAll,
  assertType,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from "vitest";
import { type Component, type ComputedRef, defineComponent, h } from "vue";
import { createAbby } from "../src";

const OLD_ENV = process.env;

beforeEach(() => {
  vi.resetModules();
  process.env = { ...OLD_ENV };
});

afterAll(() => {
  process.env = OLD_ENV;
});

function withTestComponent<T>(
  composable: () => T,
  AbbyProvider: Component
): { result: T } {
  let result!: T;
  const Child = defineComponent({
    setup() {
      result = composable();
      return () => h("div");
    },
  });

  mount(
    defineComponent({
      setup() {
        return () => h(AbbyProvider, null, { default: () => h(Child) });
      },
    })
  );

  return { result };
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

    const { result: test1Result } = withTestComponent(
      () => useAbby("test"),
      AbbyProvider
    );

    assertType<ComputedRef<"ONLY_ONE_VARIANT">>(test1Result.variant);
    assertType<"ONLY_ONE_VARIANT">(test1Result.variant.value);
    expect(test1Result.variant.value).toBeDefined();

    const { result: test2Result } = withTestComponent(
      () => useAbby("test2"),
      AbbyProvider
    );

    assertType<ComputedRef<(typeof test2Variants)[number]>>(
      test2Result.variant
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

    const { result: testFlagResult } = withTestComponent(
      () => useFeatureFlag("test"),
      AbbyProvider
    );

    expectTypeOf(testFlagResult).toEqualTypeOf<ComputedRef<boolean>>();
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

    const { result: stringRcResult } = withTestComponent(
      () => useRemoteConfig("stringRc"),
      AbbyProvider
    );
    const { result: numberRcResult } = withTestComponent(
      () => useRemoteConfig("numberRc"),
      AbbyProvider
    );
    const { result: jsonRcResult } = withTestComponent(
      () => useRemoteConfig("jsonRc"),
      AbbyProvider
    );

    expectTypeOf(stringRcResult.value).toEqualTypeOf<string>();
    expectTypeOf(numberRcResult.value).toEqualTypeOf<number>();
    expectTypeOf(jsonRcResult.value).toEqualTypeOf<Record<string, unknown>>();
  });
});
