import { renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { createAbby } from "../src";

const OLD_ENV = process.env;

vi.mock("@remix-run/react", () => ({
  useMatches: () => [],
}));

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
      currentEnvironment: "",
      environments: [],
      projectId: "123",
      tests: {
        test: { variants: ["ONLY_ONE_VARIANT"] },
        test2: {
          variants: test2Variants,
        },
      },
    });

    const wrapper = ({ children }: PropsWithChildren) => (
      <AbbyProvider>{children}</AbbyProvider>
    );

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
      currentEnvironment: "",
      environments: [],
      projectId: "123",
      flags: ["test"],
    });

    const wrapper = ({ children }: PropsWithChildren) => (
      <AbbyProvider>{children}</AbbyProvider>
    );

    renderHook(() => useFeatureFlag("test"), {
      wrapper,
    });
  });
});

describe("useRemoteConfig", () => {
  it("has the correct typings", () => {
    const { AbbyProvider, useRemoteConfig } = createAbby({
      currentEnvironment: "",
      environments: [],
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

    const wrapper = ({ children }: PropsWithChildren) => (
      <AbbyProvider>{children}</AbbyProvider>
    );

    const { result: stringRcResult } = renderHook(
      () => useRemoteConfig("stringRc"),
      {
        wrapper,
      }
    );
    const { result: numberRcResult } = renderHook(
      () => useRemoteConfig("numberRc"),
      {
        wrapper,
      }
    );
    const { result: jsonRcResult } = renderHook(
      () => useRemoteConfig("jsonRc"),
      {
        wrapper,
      }
    );

    expectTypeOf(stringRcResult.current).toEqualTypeOf<string>();
    expectTypeOf(numberRcResult.current).toEqualTypeOf<number>();
    expectTypeOf(jsonRcResult.current).toEqualTypeOf<Record<string, unknown>>();
  });
});
