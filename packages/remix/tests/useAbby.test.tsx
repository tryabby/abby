import { renderHook } from "@testing-library/react";
import { PropsWithChildren } from "react";
import { createAbby } from "../src";

vi.mock("@remix-run/react", () => ({
  useMatches: () => [],
}));

describe("useAbby", () => {
  it("returns the correct amount of options", () => {
    const { AbbyProvider, useAbby } = createAbby({
      currentEnvironment: "",
      environments: [],
      projectId: "123",
      tests: {
        test: { variants: ["OldFooter", "NewFooter"] },
        test2: {
          variants: ["SimonsText", "MatthiasText", "TomsText", "TimsText"],
        },
      },
    });

    const wrapper = ({ children }: PropsWithChildren) => <AbbyProvider>{children}</AbbyProvider>;

    const { result } = renderHook(() => useAbby("test"), {
      wrapper,
    });

    expect(result.current.variant).toBeDefined();
  });

  it("has the correct types", () => {
    const { AbbyProvider, useAbby, useFeatureFlag } = createAbby({
      currentEnvironment: "",
      environments: [],
      projectId: "123",
      tests: {
        test: { variants: ["OldFooter", "NewFooter"] },
        test2: {
          variants: ["SimonsText", "MatthiasText", "TomsText", "TimsText"],
        },
      },
      flags: ["flag1"],
    });

    const wrapper = ({ children }: PropsWithChildren) => <AbbyProvider>{children}</AbbyProvider>;

    expectTypeOf(useAbby).parameter(0).toEqualTypeOf<"test" | "test2">();

    const { result } = renderHook(() => useAbby("test"), {
      wrapper,
    });

    expectTypeOf(result.current.variant).toEqualTypeOf<"OldFooter" | "NewFooter">();

    expectTypeOf(useFeatureFlag).parameters.toEqualTypeOf<["flag1"]>();

    const { result: ffResult } = renderHook(() => useFeatureFlag("flag1"), {
      wrapper,
    });

    expectTypeOf(ffResult.current).toEqualTypeOf<boolean>();
  });

  it("uses lookup object when retrieving AB test variant", () => {
    const { getABTestValue } = createAbby({
      currentEnvironment: "",
      environments: [],
      projectId: "123",
      tests: {
        test2: {
          variants: ["SimonsText", "MatthiasText", "TomsText", "TimsText"],
        },
      },
    });

    const lookupMap = {
      SimonsText: "a",
      MatthiasText: "b",
      TomsText: "c",
      TimsText: "d",
    } as const;

    const activeVariant = getABTestValue("test2");
    const value = getABTestValue("test2", lookupMap);

    expect(value).toBe(lookupMap[activeVariant]);
  });

  it("produces proper types with a lookup objects", () => {
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
    } as const);

    expectTypeOf(activeVariant).toEqualTypeOf<"Hello" | "Bonjour" | "Hola">();
  });

  it("produces proper types with a a lookup object in the hook", () => {
    const { AbbyProvider, useAbby } = createAbby({
      currentEnvironment: "",
      environments: [],
      projectId: "123",
      tests: {
        test: {
          variants: ["A", "B", "C"],
        },
      },
    });

    const wrapper = ({ children }: PropsWithChildren) => <AbbyProvider>{children}</AbbyProvider>;

    const { result } = renderHook(
      () =>
        useAbby("test", {
          A: "Hello",
          B: "Bonjour",
          C: "Hola",
        }),
      {
        wrapper,
      }
    );

    expectTypeOf(result.current.variant).toEqualTypeOf<"Hello" | "Bonjour" | "Hola">();
  });
});
