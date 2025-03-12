import { createAbby } from "../src";
import { renderHook } from "./utils";

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

    renderHook(() => {
      const test1Result = useAbby("test")
      assertType<"ONLY_ONE_VARIANT">(test1Result.variant);
      expect(test1Result.variant).toBeDefined();
    }, AbbyProvider);



    renderHook(() => {
      const test2Result = useAbby("test2")
      assertType<(typeof test2Variants)[number]>(test2Result.variant);
      expect(test2Result.variant).toBeDefined();
    }, AbbyProvider);

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

    renderHook(
      () => {
        const testFlagResult = useFeatureFlag("test")
        expectTypeOf(testFlagResult).toEqualTypeOf<boolean>();
      }, AbbyProvider
    );

    expectTypeOf(useFeatureFlag).parameter(0).toEqualTypeOf<"test">();
  });

  // TODO: the types don't work for this yet
  it.skip("has the correct type for devOverrides", () => {
    createAbby({
      environments: [],
      projectId: "123",
      currentEnvironment: "test",
      flags: ["test"],
      settings: {
        flags: {
          devOverrides: {
            test: true,
          },
        },
      },
    });
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

    renderHook(() => {
      const stringRcResult = useRemoteConfig("stringRc")
      expectTypeOf(stringRcResult).toEqualTypeOf<string>();
    }, AbbyProvider);

    renderHook(() => {
      const numberRcResult = useRemoteConfig("numberRc")
      expectTypeOf(numberRcResult).toEqualTypeOf<number>();
    }, AbbyProvider);

    renderHook(() => {
      const jsonRcResult = useRemoteConfig("jsonRc")
      expectTypeOf(jsonRcResult).toEqualTypeOf<Record<string, unknown>>();
    }, AbbyProvider);

  });
});
