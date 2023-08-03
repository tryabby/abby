import { renderHook } from "@testing-library/react";
import { PropsWithChildren } from "react";
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
    const test2Variants = ["SimonsText", "MatthiasText", "TomsText", "TimsText"] as const;

    const { AbbyProvider, useAbby } = createAbby({
      environments: [],
      projectId: "123",
      tests: {
        test: { variants: ["ONLY_ONE_VARIANT"] },
        test2: {
          variants: test2Variants,
        },
      },
    });

    const wrapper = ({ children }: PropsWithChildren) => <AbbyProvider>{children}</AbbyProvider>;

    const { result: test1Result } = renderHook(() => useAbby("test"), {
      wrapper,
    });

    assertType<"ONLY_ONE_VARIANT">(test1Result.current.variant);

    expect(test1Result.current.variant).toBeDefined();

    const { result: test2Result } = renderHook(() => useAbby("test2"), {
      wrapper,
    });

    assertType<(typeof test2Variants)[number]>(test2Result.current.variant);

    expect(test2Result.current.variant).toBeDefined();
  });
});

describe("useFeatureFlag", () => {
  it("returns the correct types", () => {
    const { AbbyProvider, useFeatureFlag } = createAbby({
      environments: [],
      projectId: "123",
      flags: {
        test: "Boolean",
        test2: "String",
      },
    });

    const wrapper = ({ children }: PropsWithChildren) => <AbbyProvider>{children}</AbbyProvider>;

    const { result: testFlagResult } = renderHook(() => useFeatureFlag("test"), {
      wrapper,
    });
    const { result: test2FlagResult } = renderHook(() => useFeatureFlag("test2"), {
      wrapper,
    });

    expectTypeOf(testFlagResult.current).toEqualTypeOf<boolean>();
    expectTypeOf(test2FlagResult.current).toEqualTypeOf<string>();
  });

  // TODO: the types don't work for this yet
  it.skip("has the correct type for devOverrides", () => {
    const {} = createAbby({
      environments: [],
      projectId: "123",
      currentEnvironment: "test",
      flags: {
        test: "Boolean",
        test2: "String",
      },
      settings: {
        flags: {
          devOverrides: {
            test: true,
            test2: "test",
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
        flags: {
          test: "Boolean",
        },
        settings: {
          flags: {
            devOverrides: {
              test: true,
            },
          },
        },
      });
      expectTypeOf(getVariants("test")).toEqualTypeOf<["ONLY_ONE_VARIANT"]>();
    });
  });
});
