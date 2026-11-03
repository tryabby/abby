import { createAbby } from "../src";

const OLD_ENV = process.env;

beforeEach(() => {
  vi.resetModules(); // Most important - it clears the cache
  process.env = { ...OLD_ENV }; // Make a copy
});

afterAll(() => {
  process.env = OLD_ENV; // Restore old environment
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

    expectTypeOf(useAbby).parameter(0).toEqualTypeOf<"test" | "test2">();

    const { variant, onAct } = useAbby("test");

    assertType<"ONLY_ONE_VARIANT">(variant.value);
    expect(variant.value).toBeDefined();
    expectTypeOf(onAct).toEqualTypeOf<() => void>();

    const { variant: test2Result } = useAbby("test2");

    assertType<(typeof test2Variants)[number]>(test2Result.value);
    expect(test2Result.value).toBeDefined();
  });

  it("produces proper types with a lookup object", () => {
    const { useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: {
          variants: ["A", "B", "C"],
        },
      },
    });

    const { variant } = useAbby("test", {
      A: "Hello",
      B: "Bonjour",
      C: "Hola",
    });

    expectTypeOf(variant.value).toEqualTypeOf<"Hello" | "Bonjour" | "Hola">();
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

    const testFlagResult = useFeatureFlag("test");

    expectTypeOf(testFlagResult.value).toEqualTypeOf<boolean>();
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

  describe("getABTestValue", () => {
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

    expectTypeOf(stringRcResult.value).toEqualTypeOf<string>();
    expectTypeOf(numberRcResult.value).toEqualTypeOf<number>();
    expectTypeOf(jsonRcResult.value).toEqualTypeOf<Record<string, unknown>>();
  });
});
