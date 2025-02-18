import { waitFor } from "@testing-library/react";
import { AbbyEventType } from "@tryabby/core";
import { HttpService } from "@tryabby/core";
import { createAbby } from "../src";
import { TestStorageService } from "../src/StorageService";
import { renderHook } from "./utils";
import { onMounted } from "vue";

const OLD_ENV = process.env;

beforeEach(() => {
  document.cookie = "";
  vi.resetModules(); // Most important - it clears the cache
  process.env = { ...OLD_ENV }; // Make a copy
});

afterAll(() => {
  process.env = OLD_ENV; // Restore old environment
});

describe("useAbby", () => {
  it("returns the correct amount of options", () => {
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

    renderHook(() => {
      const result = useAbby("test");
      expect(result.variant).toBeDefined();
    }, AbbyProvider)

    expect(spy).toHaveBeenCalled();
  });

  it("should use the persistedValue", () => {
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

    let result: ReturnType<typeof useAbby>
    renderHook(() => {
      result = useAbby("test");
    }, AbbyProvider)

    // the stored value should not be overwritten
    expect(setSpy).not.toHaveBeenCalled();
    // value set in localstorage
    expect(result!.variant).toEqual(persistedValue);
  });

  it("looks up the selected variant in the lookup object", () => {
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

    let result: ReturnType<typeof useAbby>
    renderHook(() => {
      result = useAbby("test", {
        SimonsText: "a",
        MatthiasText: "b",
        TomsText: "c",
        TimsText: "d",
      })
    }, AbbyProvider)

    // value set in localstorage
    expect(result!.variant).toEqual("a");
  });

  it("should ping the current info on mount", () => {
    const spy = vi.spyOn(HttpService, "sendData");
    const { AbbyProvider, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["A", "B", "C"] },
      },
    });

    renderHook(() => {
      useAbby("test");
    }, AbbyProvider)

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: AbbyEventType.PING })
    );
  });

  it("should notify the server with onAct", () => {
    const spy = vi.spyOn(HttpService, "sendData");
    const { AbbyProvider, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["A", "B", "C"] },
      },
    });

    renderHook(() => {
      const result = useAbby("test");
      onMounted(() => {
        result.onAct();
      })
    }, AbbyProvider)

    // first call is tested above
    expect(spy).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ type: AbbyEventType.ACT })
    );
  });

  it("should return the correct feature flags", () => {
    const { AbbyProvider, useFeatureFlag } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      flags: ["flag1", "flag2"],
    });

    renderHook(() => {
      const flag1 = useFeatureFlag("flag1");
      // wait for the flag to be fetched
      waitFor(() => expect(flag1).toEqual(true));
    }, AbbyProvider)

    renderHook(() => {
      const flag2 = useFeatureFlag("flag2");
      expect(flag2).toEqual(false);
      // wait for the flag to be fetched
      waitFor(() => expect(flag2).toEqual(false));
    }, AbbyProvider)
  });

  it("should respect the default values for feature flags", () => {
    const { AbbyProvider, useFeatureFlag } = createAbby({
      environments: [],
      projectId: "123",
      flags: ["flag1", "flag2"],
      currentEnvironment: "a",
    });

    renderHook(() => {
      const flag1 = useFeatureFlag("flag1");
      expect(flag1).toEqual(false);
      // wait for the flag to be fetched
      waitFor(() => expect(flag1).toEqual(false));
    }, AbbyProvider)
  });

  it("uses the devOverrides", () => {
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

    renderHook(() => {
      const flag1 = useFeatureFlag("flag1");
      expect(flag1).toEqual(false);
      // will stay false and won't be overwritten by a fetch
      waitFor(() => expect(flag1).toEqual(false));
    }, AbbyProvider)

    renderHook(() => {
      const flag2 = useFeatureFlag("flag2");
      expect(flag2).toEqual(true);
      // will stay true and won't be overwritten by a fetch
      waitFor(() => expect(flag2).toEqual(true));
    }, AbbyProvider)
  });

  it("gets the stored feature flag value using a function properly", () => {
    const { getFeatureFlagValue } = createAbby({
      environments: [],
      projectId: "123",
      flags: ["flag1", "flag2"],
      currentEnvironment: "a",
    });

    // await server fetch
    waitFor(() => expect(getFeatureFlagValue("flag1")).toEqual(true));
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
    });

    expectTypeOf(activeVariant).toEqualTypeOf<"Hello" | "Bonjour" | "Hola">();
  });

  it("produces proper types with a a lookup object in the hook", () => {
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

    renderHook(
      () => {
        const result = useAbby("test", {
          A: "Hello",
          B: "Bonjour",
          C: "Hola",
        })

        expectTypeOf(result.variant).toEqualTypeOf<
          "Hello" | "Bonjour" | "Hola"
        >();
      },
      AbbyProvider
    );
  });

  it("returns correct remoteConfigValue", () => {
    const { useRemoteConfig } = createAbby({
      environments: [],
      projectId: "123",
      remoteConfig: {
        remoteConfig1: "String",
      },
      currentEnvironment: "a",
    });

    // await server fetch
    waitFor(() => expect(useRemoteConfig("remoteConfig1")).toEqual("FooBar"));
  });


  it("uses defaultValues when remoteConfig is not set", () => {
    const { useRemoteConfig } = createAbby({
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

    // await server fetch
    waitFor(() =>
      expect(useRemoteConfig("unsetRemoteConfig")).toEqual("defaultValue")
    );
  });

  it("uses devOverride for remoteConfig", () => {
    const { useRemoteConfig } = createAbby({
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

    // await server fetch
    waitFor(() =>
      expect(useRemoteConfig("remoteConfig1")).toEqual("overwrittenValue")
    );
  });
});

it("has the correct types", () => {
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

  renderHook(() => {
    const result = useAbby("test")
    expectTypeOf(result.variant).toEqualTypeOf<
      "OldFooter" | "NewFooter"
    >();
  }, AbbyProvider);

  expectTypeOf(useFeatureFlag).parameters.toEqualTypeOf<["flag1"]>();

  renderHook(() => {
    const ffResult = useFeatureFlag("flag1")
    expectTypeOf(ffResult).toEqualTypeOf<boolean>();
  }, AbbyProvider);
});

describe("useFeatureFlags()", () => {
  it("returns the correct list of feature flags", () => {
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

    renderHook(() => {
      const result = useFeatureFlags()

      expectTypeOf(result).toEqualTypeOf<
        Array<{
          name: "flag1";
          value: boolean;
        }>
      >();

      expect(result).toHaveLength(1);
      // wait for the fetch + render to go through
      waitFor(() =>
        expect(result.at(0)).toEqual({
          name: "flag1",
          value: true,
        })
      );
    }, AbbyProvider);

  });
});


describe("useRemoteConfigVariables()", () => {
  it("returns the correct list of remote config variables", () => {
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

    renderHook(() => {
      const result = useRemoteConfigVariables()
      expectTypeOf(result).toEqualTypeOf<
        Array<{
          name: "remoteConfig1";
          value: string;
        }>
      >();

      expect(result).toHaveLength(1);
      // wait for the fetch + render to go through

      expect(result.at(0)).toEqual({
        name: "remoteConfig1",
        value: expect.any(String),
      });
    }, AbbyProvider);

  });
});
