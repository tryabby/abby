import { mount } from "@vue/test-utils";
import { AbbyEventType, HttpService } from "@tryabby/core";
import { defineComponent, h, nextTick } from "vue";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAbby } from "../src";
import {
  FlagStorageService,
  RemoteConfigStorageService,
  TestStorageService,
} from "../src/StorageService";

const OLD_ENV = process.env;

beforeEach(() => {
  document.cookie = "";
  vi.resetModules();
  process.env = { ...OLD_ENV };
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(() => {
  process.env = OLD_ENV;
});

function renderHook<T>(useHook: () => T, AbbyProvider: any, initialData?: any) {
  let result!: T;
  const TestComponent = defineComponent({
    setup() {
      result = useHook();
      return () => h("div");
    },
  });

  const wrapper = mount(
    defineComponent({
      setup() {
        return () =>
          h(
            AbbyProvider,
            initialData ? { initialData } : null,
            { default: () => h(TestComponent) }
          );
      },
    })
  );

  return { result, wrapper };
}

describe("useAbby", () => {
  it("returns the correct variant and calls storage set", () => {
    const spy = vi.spyOn(TestStorageService, "set");

    const { AbbyProvider, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["OldFooter", "NewFooter"] },
      },
    });

    const { result } = renderHook(() => useAbby("test"), AbbyProvider);

    expect(spy).toHaveBeenCalled();
    expect(result.variant.value).toBeDefined();
    expect(["OldFooter", "NewFooter"]).toContain(result.variant.value);
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

    const { result } = renderHook(() => useAbby("test"), AbbyProvider);

    expect(setSpy).not.toHaveBeenCalled();
    expect(result.variant.value).toEqual(persistedValue);
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

    const { result } = renderHook(
      () =>
        useAbby("test", {
          SimonsText: "Foo",
          MatthiasText: "Bar",
          TomsText: "Baz",
          TimsText: "Qux",
        }),
      AbbyProvider
    );

    expect(result.variant.value).toEqual("Foo");
  });

  it("sends ping on variant selection and act on onAct()", async () => {
    const spy = vi.spyOn(HttpService, "sendData");

    const { AbbyProvider, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["A", "B"] },
      },
    });

    const { result } = renderHook(() => useAbby("test"), AbbyProvider);

    await nextTick();

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AbbyEventType.PING,
        data: expect.objectContaining({
          projectId: "123",
          testName: "test",
        }),
      })
    );

    result.onAct();

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AbbyEventType.ACT,
        data: expect.objectContaining({
          projectId: "123",
          testName: "test",
        }),
      })
    );
  });

  it("throws when used outside AbbyProvider", () => {
    const { useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["A", "B"] },
      },
    });

    const TestComponent = defineComponent({
      setup() {
        useAbby("test");
        return () => h("div");
      },
    });

    expect(() => mount(TestComponent)).toThrowError(
      "useAbbyData must be used within an AbbyProvider"
    );
  });
});

describe("useFeatureFlag", () => {
  it("returns feature flag value", () => {
    process.env.NODE_ENV = "development";
    const { AbbyProvider, useFeatureFlag } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      flags: ["flag1", "flag2"],
      settings: {
        flags: {
          devOverrides: {
            flag1: true,
            flag2: false,
          },
        },
      },
    });

    const { result } = renderHook(() => {
      const f1 = useFeatureFlag("flag1");
      const f2 = useFeatureFlag("flag2");
      return { f1, f2 };
    }, AbbyProvider);

    expect(result.f1.value).toBe(true);
    expect(result.f2.value).toBe(false);
  });
});

describe("useRemoteConfig", () => {
  it("returns remote config value", () => {
    process.env.NODE_ENV = "development";
    const { AbbyProvider, useRemoteConfig } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      remoteConfig: {
        bannerText: "String",
        bannerCount: "Number",
      },
      settings: {
        remoteConfig: {
          devOverrides: {
            bannerText: "Hello Vue!",
            bannerCount: 42,
          },
        },
      },
    });

    const { result } = renderHook(() => {
      const text = useRemoteConfig("bannerText");
      const count = useRemoteConfig("bannerCount");
      return { text, count };
    }, AbbyProvider);

    expect(result.text.value).toBe("Hello Vue!");
    expect(result.count.value).toBe(42);
  });
});

describe("synchronous getters and helpers", () => {
  it("supports getFeatureFlagValue, getRemoteConfig, getABTestValue and reset", () => {
    process.env.NODE_ENV = "development";
    const removeSpy = vi.spyOn(TestStorageService, "remove");

    const abby = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "test-proj",
      flags: ["betaFeature"],
      remoteConfig: {
        maxItems: "Number",
      },
      tests: {
        colorTest: { variants: ["red", "blue"] },
      },
      settings: {
        flags: { devOverrides: { betaFeature: true } },
        remoteConfig: { devOverrides: { maxItems: 10 } },
      },
    });

    expect(abby.getFeatureFlagValue("betaFeature")).toBe(true);
    expect(abby.getRemoteConfig("maxItems")).toBe(10);

    const val = abby.getABTestValue("colorTest");
    expect(["red", "blue"]).toContain(val);

    const resetFn = abby.getABResetFunction("colorTest");
    resetFn();
    expect(removeSpy).toHaveBeenCalledWith("test-proj", "colorTest");

    expect(abby.getVariants("colorTest")).toEqual(["red", "blue"]);
  });
});
