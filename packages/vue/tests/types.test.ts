import { describe, expectTypeOf, it } from "vitest";
import { createAbby } from "../src";
import { renderComposable } from "./helpers";

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

    expectTypeOf(useAbby).parameter(0).toEqualTypeOf<"test" | "test2">();

    const { result: test1Result } = renderComposable(
      () => useAbby("test"),
      AbbyProvider
    );

    expectTypeOf(test1Result.variant.value).toEqualTypeOf<"ONLY_ONE_VARIANT">();

    const { result: test2Result } = renderComposable(
      () => useAbby("test2"),
      AbbyProvider
    );

    expectTypeOf(test2Result.variant.value).toEqualTypeOf<
      (typeof test2Variants)[number]
    >();
  });

  it("produces proper types with a lookup object", () => {
    const { AbbyProvider, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: {
          variants: ["A", "B", "C"],
        },
      },
    });

    const { result } = renderComposable(
      () =>
        useAbby("test", {
          A: "Hello",
          B: "Bonjour",
          C: "Hola",
        }),
      AbbyProvider
    );

    expectTypeOf(result.variant.value).toEqualTypeOf<
      "Hello" | "Bonjour" | "Hola"
    >();
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

    expectTypeOf(useFeatureFlag).parameter(0).toEqualTypeOf<"test">();

    const { result } = renderComposable(
      () => useFeatureFlag("test"),
      AbbyProvider
    );

    expectTypeOf(result.value).toEqualTypeOf<boolean>();
  });
});

describe("useRemoteConfig", () => {
  it("returns the correct types", () => {
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
