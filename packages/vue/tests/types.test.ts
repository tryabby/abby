import { describe, expectTypeOf, it } from "vitest";
import type { ComputedRef, Ref } from "vue";
import { createAbby } from "../src";

describe("useAbby types", () => {
  it("infers the variant type and constrains the test name", () => {
    const { useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["ONLY_ONE_VARIANT"] },
        test2: { variants: ["A", "B"] },
      },
    });

    expectTypeOf(useAbby).parameter(0).toEqualTypeOf<"test" | "test2">();

    const single = useAbby("test");
    expectTypeOf(single.variant).toEqualTypeOf<
      ComputedRef<"ONLY_ONE_VARIANT">
    >();
    expectTypeOf(single.onAct).toEqualTypeOf<() => void>();

    const looked = useAbby("test2", { A: 1, B: 2 });
    expectTypeOf(looked.variant).toMatchTypeOf<ComputedRef<number>>();
  });
});

describe("useFeatureFlag types", () => {
  it("is a Ref<boolean> and constrains the flag name", () => {
    const { useFeatureFlag } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      flags: ["test"],
    });

    expectTypeOf(useFeatureFlag).parameter(0).toEqualTypeOf<"test">();
    expectTypeOf(useFeatureFlag("test")).toEqualTypeOf<Ref<boolean>>();
  });
});

describe("useRemoteConfig types", () => {
  it("maps each remote config type to its value type", () => {
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

    expectTypeOf(useRemoteConfig("stringRc")).toEqualTypeOf<Ref<string>>();
    expectTypeOf(useRemoteConfig("numberRc")).toEqualTypeOf<Ref<number>>();
    expectTypeOf(useRemoteConfig("jsonRc")).toEqualTypeOf<
      Ref<Record<string, unknown>>
    >();
  });
});
