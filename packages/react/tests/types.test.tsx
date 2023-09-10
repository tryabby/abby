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
      flags: ["test"],
    });

    const wrapper = ({ children }: PropsWithChildren) => <AbbyProvider>{children}</AbbyProvider>;

    const { result: testFlagResult } = renderHook(() => useFeatureFlag("test"), {
      wrapper,
    });

    expectTypeOf(testFlagResult.current).toEqualTypeOf<boolean>();
    expectTypeOf(useFeatureFlag).parameter(0).toEqualTypeOf<"test">();
  });

  // TODO: the types don't work for this yet
  it.skip("has the correct type for devOverrides", () => {
    const {} = createAbby({
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
      expectTypeOf(getVariants("test")).toEqualTypeOf<["ONLY_ONE_VARIANT"]>();
    });
  });
});

describe("useRemoteConfig", () => {
  it("uses correct typings", () => {
    const { AbbyProvider, useRemoteConfig } = createAbby({
      environments: [],
      projectId: "123",
      remoteConfig: {
        stringRc: "String",
        numberRc: "Number",
        jsonRc: "JSON",
      },
    });

    expectTypeOf(useRemoteConfig).parameter(0).toEqualTypeOf<"stringRc" | "numberRc" | "jsonRc">();

    const wrapper = ({ children }: PropsWithChildren) => <AbbyProvider>{children}</AbbyProvider>;
    const { result: stringRcResult } = renderHook(() => useRemoteConfig("stringRc"), {
      wrapper,
    });
    const { result: numberRcResult } = renderHook(() => useRemoteConfig("numberRc"), {
      wrapper,
    });
    const { result: jsonRcResult } = renderHook(() => useRemoteConfig("jsonRc"), {
      wrapper,
    });

    expectTypeOf(stringRcResult.current).toEqualTypeOf<string>();
    expectTypeOf(numberRcResult.current).toEqualTypeOf<number>();
    expectTypeOf(jsonRcResult.current).toEqualTypeOf<Record<string, unknown>>();
  });
});
