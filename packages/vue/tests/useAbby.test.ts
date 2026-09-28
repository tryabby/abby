import { flushPromises, mount } from "@vue/test-utils";
import { AbbyEventType, HttpService } from "@tryabby/core";
import { type Component, defineComponent, h, nextTick } from "vue";
import { createAbby } from "../src";
import { TestStorageService } from "../src/StorageService";

const OLD_ENV = process.env;

function clearCookies() {
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0]?.trim();
    if (name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  }
}

beforeEach(() => {
  clearCookies();
  vi.resetModules(); // Most important - it clears the cache
  process.env = { ...OLD_ENV }; // Make a copy
});

afterAll(() => {
  process.env = OLD_ENV; // Restore old environment
});

/**
 * Mounts a probe component that calls `useFn` inside `setup()`
 * as a descendant of the given AbbyProvider.
 */
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
  it("returns the correct amount of options", async () => {
    const spy = vi.spyOn(TestStorageService, "set");

    const { AbbyProvider, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["OldFooter", "NewFooter"] },
        test2: {
          variants: ["SimonsText", "MatthiasText", "TomsText", "TimsText"],
        },
      },
    });

    const { result } = mountComposable(AbbyProvider, () => useAbby("test"));
    await nextTick();

    expect(spy).toHaveBeenCalled();
    expect(result().variant.value).toBeDefined();
    expect(result().onAct).toBeDefined();
  });

  it("should use the persistedValue", async () => {
    const persistedValue = "SimonsText";
    const variants = ["SimonsText", "MatthiasText", "TomsText", "TimsText"];

    const getSpy = vi.spyOn(TestStorageService, "get");
    const setSpy = vi.spyOn(TestStorageService, "set");

    getSpy.mockReturnValue(persistedValue);

    const { AbbyProvider, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants },
      },
    });

    const { result } = mountComposable(AbbyProvider, () => useAbby("test"));
    await nextTick();

    // the stored value should not be overwritten
    expect(setSpy).not.toHaveBeenCalled();

    // value set in localstorage
    expect(result().variant.value).toEqual(persistedValue);
  });

  it("looks up the selected variant in the lookup object", async () => {
    const persistedValue = "SimonsText";
    const variants = [
      "SimonsText",
      "MatthiasText",
      "TomsText",
      "TimsText",
    ] as const;

    const getSpy = vi.spyOn(TestStorageService, "get");
    getSpy.mockReturnValue(persistedValue);

    const { AbbyProvider, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants },
      },
    });

    const { result } = mountComposable(AbbyProvider, () =>
      useAbby("test", {
        SimonsText: "a",
        MatthiasText: "b",
        TomsText: "c",
        TimsText: "d",
      })
    );
    await nextTick();

    // value set in localstorage
    expect(result().variant.value).toEqual("a");
  });

  it("should ping the current info on mount", async () => {
    const spy = vi.spyOn(HttpService, "sendData");
    const { AbbyProvider, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["A", "B", "C"] },
      },
    });

    mountComposable(AbbyProvider, () => useAbby("test"));
    await nextTick();

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: AbbyEventType.PING })
    );
  });

  it("should notify the server with onAct", async () => {
    const spy = vi.spyOn(HttpService, "sendData");
    const { AbbyProvider, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["A", "B", "C"] },
      },
    });

    const { result } = mountComposable(AbbyProvider, () => useAbby("test"));
    // let the mount PING flush first
    await nextTick();

    result().onAct();
    await nextTick();

    // call history is restored between tests, so assert the ACT ping as the
    // last sendData call of THIS test (mount PING flushes first)
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: AbbyEventType.ACT })
    );
  });

  it("should return the correct feature flags", async () => {
    const { AbbyProvider, useFeatureFlag } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      flags: ["flag1", "flag2"],
    });

    const { result: flag1 } = mountComposable(AbbyProvider, () =>
      useFeatureFlag("flag1")
    );

    // wait for the flag to be fetched
    await vi.waitFor(() => expect(flag1().value).toEqual(true));

    const { result: flag2 } = mountComposable(AbbyProvider, () =>
      useFeatureFlag("flag2")
    );
    await flushPromises();

    // wait for the flag to be fetched
    await vi.waitFor(() => expect(flag2().value).toEqual(false));
  });

  it("should respect the default values for feature flags", async () => {
    const { AbbyProvider, useFeatureFlag } = createAbby({
      environments: [],
      projectId: "123",
      flags: ["flag1", "flag2"],
      currentEnvironment: "a",
    });

    const { result: flag1 } = mountComposable(AbbyProvider, () =>
      useFeatureFlag("flag1")
    );
    // the flag has not been fetched yet on first render,
    // so the default value is returned (mirrors the React test,
    // which asserts synchronously)
    expect(flag1().value).toEqual(false);
  });

  it("uses the devOverrides", async () => {
    process.env.NODE_ENV = "development";
    const { AbbyProvider, useFeatureFlag } = createAbby({
      environments: [],
      projectId: "123",
      flags: ["flag1", "flag2"],
      currentEnvironment: "a",
      settings: {
        flags: {
          devOverrides: {
            flag1: false,
            flag2: true,
          },
        },
      },
    });

    const { result: flag1 } = mountComposable(AbbyProvider, () =>
      useFeatureFlag("flag1")
    );
    await flushPromises();

    expect(flag1().value).toEqual(false);

    const { result: flag2 } = mountComposable(AbbyProvider, () =>
      useFeatureFlag("flag2")
    );
    await flushPromises();

    expect(flag2().value).toEqual(true);
  });

  it("gets the stored feature flag value using a function properly", async () => {
    const { AbbyProvider, getFeatureFlagValue } = createAbby({
      environments: [],
      projectId: "123",
      flags: ["flag1", "flag2"],
      currentEnvironment: "a",
    });

    // mount the provider so the project data is fetched from the server
    mountComposable(AbbyProvider, () => null);

    // await server fetch
    await vi.waitFor(() => expect(getFeatureFlagValue("flag1")).toEqual(true));
    expect(getFeatureFlagValue("flag2")).toEqual(false);
  });

  it("returns the correct possible variant values", () => {
    const { getVariants } = createAbby({
      environments: [],
      projectId: "123",
      currentEnvironment: "a",
      tests: {
        test: {
          variants: ["A", "B", "C"],
        },
      },
    });
    expect(getVariants("test")).toEqual(["A", "B", "C"]);
  });

  it("uses the lookup object when retrieving a variant", () => {
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

    const activeVariant = getABTestValue("test");
    const lookupObject = {
      A: 1,
      B: 2,
      C: 3,
    };

    expect(getABTestValue("test", lookupObject)).toEqual(
      lookupObject[activeVariant]
    );
  });

  it("produces proper types with a lookup object", () => {
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
    });

    expectTypeOf(activeVariant).toEqualTypeOf<"Hello" | "Bonjour" | "Hola">();
  });

  it("produces proper types with a lookup object in the composable", async () => {
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

    const { result } = mountComposable(AbbyProvider, () =>
      useAbby("test", {
        A: "Hello",
        B: "Bonjour",
        C: "Hola",
      })
    );
    await nextTick();

    expectTypeOf(result().variant.value).toEqualTypeOf<
      "Hello" | "Bonjour" | "Hola"
    >();
  });

  it("returns correct remoteConfigValue", async () => {
    const { AbbyProvider, useRemoteConfig } = createAbby({
      environments: [],
      projectId: "123",
      remoteConfig: {
        remoteConfig1: "String",
      },
      currentEnvironment: "a",
    });

    const { result } = mountComposable(AbbyProvider, () =>
      useRemoteConfig("remoteConfig1")
    );

    // await server fetch
    await vi.waitFor(() => expect(result().value).toEqual("FooBar"));
  });

  it("uses defaultValues when remoteConfig is not set", async () => {
    const { AbbyProvider, useRemoteConfig } = createAbby({
      environments: [],
      projectId: "123",
      remoteConfig: {
        unsetRemoteConfig: "String",
      },
      settings: {
        remoteConfig: {
          defaultValues: {
            String: "defaultValue",
          },
        },
      },
      currentEnvironment: "a",
    });

    const { result } = mountComposable(AbbyProvider, () =>
      useRemoteConfig("unsetRemoteConfig")
    );

    // await server fetch
    await vi.waitFor(() => expect(result().value).toEqual("defaultValue"));
  });

  it("uses devOverride for remoteConfig", async () => {
    process.env.NODE_ENV = "development";
    const { AbbyProvider, useRemoteConfig } = createAbby({
      environments: [],
      projectId: "123",
      remoteConfig: {
        remoteConfig1: "String",
      },
      settings: {
        remoteConfig: {
          devOverrides: {
            remoteConfig1: "overwrittenValue",
          },
        },
      },
      currentEnvironment: "a",
    });

    const { result } = mountComposable(AbbyProvider, () =>
      useRemoteConfig("remoteConfig1")
    );

    // await server fetch
    await vi.waitFor(() => expect(result().value).toEqual("overwrittenValue"));
  });
});

it("has the correct types", async () => {
  const { AbbyProvider, useAbby, useFeatureFlag } = createAbby({
    environments: [""],
    currentEnvironment: "",
    projectId: "123",
    tests: {
      test: { variants: ["OldFooter", "NewFooter"] },
      test2: {
        variants: ["SimonsText", "MatthiasText", "TomsText", "TimsText"],
      },
    },
    flags: ["flag1"],
  });

  expectTypeOf(useAbby).parameter(0).toEqualTypeOf<"test" | "test2">();

  const { result } = mountComposable(AbbyProvider, () => useAbby("test"));
  await nextTick();

  expectTypeOf(result().variant.value).toEqualTypeOf<
    "OldFooter" | "NewFooter"
  >();

  expectTypeOf(useFeatureFlag).parameters.toEqualTypeOf<["flag1"]>();

  const { result: ffResult } = mountComposable(AbbyProvider, () =>
    useFeatureFlag("flag1")
  );
  await nextTick();

  expectTypeOf(ffResult().value).toEqualTypeOf<boolean>();
});

describe("useFeatureFlags()", () => {
  it("returns the correct list of feature flags", async () => {
    const { AbbyProvider, useFeatureFlags } = createAbby({
      environments: [],
      currentEnvironment: "test",
      projectId: "123",
      tests: {
        test: { variants: ["OldFooter", "NewFooter"] },
        test2: {
          variants: ["SimonsText", "MatthiasText", "TomsText", "TimsText"],
        },
      },
      flags: ["flag1"],
    });

    expectTypeOf(useFeatureFlags).parameter(0).toEqualTypeOf<undefined>();

    const { result } = mountComposable(AbbyProvider, () => useFeatureFlags());
    await nextTick();

    expectTypeOf(result().value).toEqualTypeOf<
      Array<{
        name: "flag1";
        value: boolean;
      }>
    >();

    expect(result().value).toHaveLength(1);
    // wait for the fetch + render to go through
    await vi.waitFor(() =>
      expect(result().value.at(0)).toEqual({
        name: "flag1",
        value: true,
      })
    );
  });
});

describe("useRemoteConfigVariables()", () => {
  it("returns the correct list of remote config variables", async () => {
    const { AbbyProvider, useRemoteConfigVariables } = createAbby({
      environments: [],
      currentEnvironment: "test",
      projectId: "123",
      remoteConfig: {
        remoteConfig1: "String",
      },
    });

    expectTypeOf(useRemoteConfigVariables)
      .parameter(0)
      .toEqualTypeOf<undefined>();

    const { result } = mountComposable(AbbyProvider, () =>
      useRemoteConfigVariables()
    );
    await nextTick();

    expectTypeOf(result().value).toEqualTypeOf<
      Array<{
        name: "remoteConfig1";
        value: string;
      }>
    >();

    expect(result().value).toHaveLength(1);
    // wait for the fetch + render to go through
    await vi.waitFor(() =>
      expect(result().value.at(0)).toEqual({
        name: "remoteConfig1",
        value: expect.any(String),
      })
    );
  });
});
