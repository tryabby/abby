import { renderHook } from "@testing-library/react";
import { NextApiRequest, NextApiResponse } from "next";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
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

    renderHook(() => useFeatureFlag("test"), {
      wrapper,
    });
  });

  // TODO: the types don't work for this yet
  it.skip("has the correct type for devOverrides", () => {
    const { useAbby } = createAbby({
      environments: [],
      projectId: "123",
      currentEnvironment: "test",
      flags: ["test"],
      tests: {
        a: {
          variants: ["a1", "a2"],
        },
      },
      settings: {
        flags: {
          devOverrides: {
            test: true,
          },
        },
      },
    });
  });

  // we only need typesafety here
  it.skip("has the correct types for getABTestValue", () => {
    const { getABTestValue } = createAbby({
      environments: [],
      projectId: "123",
      currentEnvironment: "test",
      flags: ["test"],
      tests: {
        a: {
          variants: ["a1", "a2"],
        },
      },
    });

    const [variants, setCookie] = getABTestValue("a");

    expectTypeOf(variants).toEqualTypeOf<"a1" | "a2">();

    expectTypeOf(setCookie).toEqualTypeOf<() => void>();

    // on client -> no request thereforen no res
    const [, setCookieOnClient] = getABTestValue("a");

    expectTypeOf(setCookieOnClient).toEqualTypeOf<() => void>();

    // on edge -> res is NextResponse
    const [, setCookieOnEdge] = getABTestValue("a", {} as NextRequest);

    expectTypeOf(setCookieOnEdge).toEqualTypeOf<(res: NextResponse) => void>();

    // on server -> res is NextApiResponse
    const [, setCookieOnServer] = getABTestValue("a", {} as NextApiRequest);

    expectTypeOf(setCookieOnServer).toEqualTypeOf<(res: NextApiResponse) => void>();
  });

  // we only need typesafety here
  it.skip("has the correct values for withAbbyEdge", async () => {
    const { withAbbyEdge, withAbbyApiHandler } = createAbby({
      environments: [],
      projectId: "123",
      currentEnvironment: "test",
    });

    const edgeHandler = withAbbyEdge((req) => {});

    expectTypeOf(edgeHandler).parameters.toEqualTypeOf<[NextRequest, NextFetchEvent]>();

    const apiHandler = withAbbyApiHandler((req, res) => {});

    expectTypeOf(apiHandler).parameters.toEqualTypeOf<[NextApiRequest, NextApiResponse]>();
  });
});

describe("useRemoteConfig", () => {
  it.skip("has the correct typings", () => {
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
