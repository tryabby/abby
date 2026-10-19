import type { ComputedRef } from "vue";
import { createAbby } from "../src";

const OLD_ENV = process.env;

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

    const { useAbby } = createAbby({
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

    const test1Result = useAbby("test");
    assertType<ComputedRef<"ONLY_ONE_VARIANT">>(test1Result.variant);
    expect(test1Result.variant.value).toBeDefined();

    const test2Result = useAbby("test2");
    assertType<ComputedRef<(typeof test2Variants)[number]>>(
      test2Result.variant
    );
    expect(test2Result.variant.value).toBeDefined();
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

    const testFlagResult = useFeatureFlag("test");
    expectTypeOf(testFlagResult).toEqualTypeOf<ComputedRef<boolean>>();
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

    const stringRcResult = useRemoteConfig("stringRc");
    const numberRcResult = useRemoteConfig("numberRc");
    const jsonRcResult = useRemoteConfig("jsonRc");

    expectTypeOf(stringRcResult).toEqualTypeOf<ComputedRef<string>>();
    expectTypeOf(numberRcResult).toEqualTypeOf<ComputedRef<number>>();
    expectTypeOf(jsonRcResult).toEqualTypeOf<
      ComputedRef<Record<string, unknown>>
    >();
  });
});
