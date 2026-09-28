import { mount } from "@vue/test-utils";
import { type Component, defineComponent, h, nextTick } from "vue";
import { createAbby } from "../src";

const OLD_ENV = process.env;

beforeEach(() => {
  vi.resetModules(); // Most important - it clears the cache
  process.env = { ...OLD_ENV }; // Make a copy
});

afterAll(() => {
  process.env = OLD_ENV; // Restore old environment
});

function mountComposable<T>(AbbyProvider: Component, useFn: () => T) {
  let result!: T;
  const Probe = defineComponent({
    setup() {
      result = useFn();
      return () => h("div");
    },
  });
  const wrapper = mount(
    defineComponent({
      render() {
        return h(AbbyProvider as any, null, {
          default: () => h(Probe),
        });
      },
    })
  );
  return { wrapper, result: () => result };
}

describe("useAbby", () => {
  it("returns the correct types", async () => {
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

    const { result: test1Result } = mountComposable(AbbyProvider, () =>
      useAbby("test")
    );
    await nextTick();

    // undefined covers the SSR/first render before the client resolves a variant
    assertType<"ONLY_ONE_VARIANT" | undefined>(test1Result().variant.value);

    expect(test1Result().variant.value).toBeDefined();

    const { result: test2Result } = mountComposable(AbbyProvider, () =>
      useAbby("test2")
    );
    await nextTick();

    assertType<(typeof test2Variants)[number] | undefined>(
      test2Result().variant.value
    );

    expect(test2Result().variant.value).toBeDefined();
  });
});

describe("useFeatureFlag", () => {
  it("returns the correct types", async () => {
    const { AbbyProvider, useFeatureFlag } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      flags: ["test"],
    });

    const { result: testFlagResult } = mountComposable(AbbyProvider, () =>
      useFeatureFlag("test")
    );
    await nextTick();

    expectTypeOf(testFlagResult().value).toEqualTypeOf<boolean>();
    expectTypeOf(useFeatureFlag).parameter(0).toEqualTypeOf<"test">();
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
  it("uses correct typings", async () => {
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

    const { result: stringRcResult } = mountComposable(AbbyProvider, () =>
      useRemoteConfig("stringRc")
    );
    const { result: numberRcResult } = mountComposable(AbbyProvider, () =>
      useRemoteConfig("numberRc")
    );
    const { result: jsonRcResult } = mountComposable(AbbyProvider, () =>
      useRemoteConfig("jsonRc")
    );
    await nextTick();

    expectTypeOf(stringRcResult().value).toEqualTypeOf<string>();
    expectTypeOf(numberRcResult().value).toEqualTypeOf<number>();
    expectTypeOf(jsonRcResult().value).toEqualTypeOf<Record<string, unknown>>();
  });
});
