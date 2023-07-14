import { renderHook } from "@testing-library/react";
import { PropsWithChildren } from "react";
import { createAbby } from "../src";

describe("useAbby", () => {
  it("returns the correct amount of options", () => {
    const { AbbyProvider, useAbby } = createAbby({
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
      projectId: "123",
      tests: {
        test: { variants: ["OldFooter", "NewFooter"] },
        test2: {
          variants: ["SimonsText", "MatthiasText", "TomsText", "TimsText"],
        },
      },
      flags: {
        flag1: "Boolean",
        flag2: "String",
      },
    });

    const wrapper = ({ children }: PropsWithChildren) => <AbbyProvider>{children}</AbbyProvider>;

    expectTypeOf(useAbby).parameters.toEqualTypeOf<["test" | "test2"]>();

    const { result } = renderHook(() => useAbby("test"), {
      wrapper,
    });

    expectTypeOf(result.current.variant).toEqualTypeOf<"OldFooter" | "NewFooter">();

    expectTypeOf(useFeatureFlag).parameters.toEqualTypeOf<["flag1" | "flag2"]>();

    const { result: ffResult } = renderHook(() => useFeatureFlag("flag1"), {
      wrapper,
    });

    expectTypeOf(ffResult.current).toEqualTypeOf<boolean>();

    const { result: ff2Result } = renderHook(() => useFeatureFlag("flag2"), {
      wrapper,
    });

    expectTypeOf(ff2Result.current).toEqualTypeOf<string>();
  });
});
