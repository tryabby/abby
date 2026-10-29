import {
  ABBY_BASE_URL,
  AbbyEventType,
  HttpService,
  getABStorageKey,
  getFFStorageKey,
} from "@tryabby/core";
import { mount } from "@vue/test-utils";
import { rest } from "msw";
import { defineComponent, h, nextTick, watch } from "vue";
import { createAbby } from "../src";
import { server } from "./mocks/server";
import { initialData, setStoredVariant, withSetup } from "./utils";

const OLD_ENV = process.env;

beforeEach(() => {
  process.env = { ...OLD_ENV };
});

afterAll(() => {
  process.env = OLD_ENV;
});

const createTestAbby = () =>
  createAbby({
    projectId: "123",
    environments: [""],
    currentEnvironment: "",
    tests: { test: { variants: ["A", "B", "C"] } },
    flags: ["flag1", "flag2"],
    remoteConfig: { text: "String", count: "Number" },
  });

describe("useAbby", () => {
  it("returns one of the variants once mounted", () => {
    const { AbbyPlugin, useAbby } = createTestAbby();

    const { result } = withSetup(() => useAbby("test"), AbbyPlugin, {
      initialData,
    });

    expect(["A", "B", "C"]).toContain(result.variant.value);
  });

  it("uses the stored variant", () => {
    setStoredVariant("123", "test", "B");
    const { AbbyPlugin, useAbby } = createTestAbby();

    const { result } = withSetup(() => useAbby("test"), AbbyPlugin, {
      initialData,
    });

    expect(result.variant.value).toBe("B");
  });

  it("looks up the selected variant in the lookup object", () => {
    setStoredVariant("123", "test", "C");
    const { AbbyPlugin, useAbby } = createTestAbby();

    const { result } = withSetup(
      () => useAbby("test", { A: "red", B: "green", C: "blue" }),
      AbbyPlugin,
      { initialData }
    );

    expect(result.variant.value).toBe("blue");
  });

  it("renders the variant in a component", async () => {
    setStoredVariant("123", "test", "A");
    const { AbbyPlugin, useAbby } = createTestAbby();

    const wrapper = mount(
      defineComponent({
        setup() {
          const { variant } = useAbby("test");
          return () => h("p", variant.value);
        },
      }),
      { global: { plugins: [[AbbyPlugin, { initialData }]] } }
    );
    await nextTick();

    expect(wrapper.text()).toBe("A");
  });

  it("pings the server with the selected variant after mount", async () => {
    setStoredVariant("123", "test", "B");
    const spy = vi
      .spyOn(HttpService, "sendData")
      .mockImplementation(() => undefined);
    const { AbbyPlugin, useAbby } = createTestAbby();

    withSetup(() => useAbby("test"), AbbyPlugin, { initialData });
    await nextTick();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AbbyEventType.PING,
        data: { projectId: "123", selectedVariant: "B", testName: "test" },
      })
    );
  });

  it("notifies the server with onAct", async () => {
    setStoredVariant("123", "test", "C");
    const spy = vi
      .spyOn(HttpService, "sendData")
      .mockImplementation(() => undefined);
    const { AbbyPlugin, useAbby } = createTestAbby();

    const { result } = withSetup(() => useAbby("test"), AbbyPlugin, {
      initialData,
    });
    result.onAct();

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AbbyEventType.ACT,
        data: { projectId: "123", selectedVariant: "C", testName: "test" },
      })
    );
  });

  it("updates the variant and pings again when it changes", async () => {
    setStoredVariant("123", "test", "A");
    const spy = vi
      .spyOn(HttpService, "sendData")
      .mockImplementation(() => undefined);
    const { AbbyPlugin, useAbby, __abby__ } = createTestAbby();

    const { result } = withSetup(() => useAbby("test"), AbbyPlugin, {
      initialData,
    });
    await nextTick();

    // this is what the devtools do
    __abby__.updateLocalVariant("test", "C");
    await nextTick();

    expect(result.variant.value).toBe("C");
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        type: AbbyEventType.PING,
        data: { projectId: "123", selectedVariant: "C", testName: "test" },
      })
    );
  });

  it("uses the weights from the API for new visitors", async () => {
    // a random value close to 1 picks the last variant when all weights are equal
    vi.spyOn(window.crypto, "getRandomValues").mockImplementation((array) => {
      (array as Uint32Array)[0] = 0xffffffff;
      return array;
    });
    const { AbbyPlugin, useAbby } = createAbby({
      projectId: "123",
      environments: [""],
      currentEnvironment: "",
      tests: { test2: { variants: ["A", "B"] } },
    });

    // the mocked API gives B a weight of 0
    const { result } = withSetup(() => useAbby("test2"), AbbyPlugin);
    expect(result.variant.value).toBe("");

    await vi.waitFor(() => expect(result.variant.value).not.toBe(""));
    expect(result.variant.value).toBe("A");
    expect(document.cookie).toContain(`${getABStorageKey("123", "test2")}=A`);
  });

  it("still selects a variant if the data can't be loaded", async () => {
    server.use(
      rest.get(`${ABBY_BASE_URL}api/v2/data/:projectId`, (_req, res, ctx) =>
        res(ctx.status(500))
      )
    );
    const { AbbyPlugin, useAbby } = createTestAbby();

    const { result } = withSetup(() => useAbby("test"), AbbyPlugin);

    await vi.waitFor(() =>
      expect(["A", "B", "C"]).toContain(result.variant.value)
    );
  });

  it("throws a helpful error without the plugin", () => {
    const { useAbby } = createTestAbby();

    expect(() => useAbby("test")).toThrowError(/app\.use\(AbbyPlugin\)/);
    expect(() =>
      mount(
        defineComponent({
          setup() {
            useAbby("test");
            return () => null;
          },
        })
      )
    ).toThrowError(/app\.use\(AbbyPlugin\)/);
  });
});

describe("useFeatureFlag", () => {
  it("returns the flag values", () => {
    const { AbbyPlugin, useFeatureFlag } = createTestAbby();

    const { result } = withSetup(
      () => ({
        flag1: useFeatureFlag("flag1"),
        flag2: useFeatureFlag("flag2"),
      }),
      AbbyPlugin,
      { initialData }
    );

    expect(result.flag1.value).toBe(true);
    expect(result.flag2.value).toBe(false);
  });

  it("loads the data from the API without initialData", async () => {
    const { AbbyPlugin, useFeatureFlag } = createTestAbby();

    const { result } = withSetup(() => useFeatureFlag("flag1"), AbbyPlugin);
    expect(result.value).toBe(false);

    await vi.waitFor(() => expect(result.value).toBe(true));
  });

  it("uses the devOverrides in development", () => {
    process.env.NODE_ENV = "development";
    const { AbbyPlugin, useFeatureFlag } = createAbby({
      projectId: "123",
      environments: [""],
      currentEnvironment: "",
      flags: ["flag1"],
      settings: { flags: { devOverrides: { flag1: false } } },
    });

    const { result } = withSetup(() => useFeatureFlag("flag1"), AbbyPlugin, {
      initialData,
    });

    expect(result.value).toBe(false);
  });

  it("re-renders when a flag changes", async () => {
    const { AbbyPlugin, useFeatureFlag, __abby__ } = createTestAbby();

    const wrapper = mount(
      defineComponent({
        setup() {
          const flag1 = useFeatureFlag("flag1");
          return () => h("p", flag1.value ? "on" : "off");
        },
      }),
      { global: { plugins: [[AbbyPlugin, { initialData }]] } }
    );
    expect(wrapper.text()).toBe("on");

    // this is what the devtools do
    __abby__.updateFlag("flag1", false);
    await nextTick();

    expect(wrapper.text()).toBe("off");
  });

  it("returns all flags with useFeatureFlags", async () => {
    const { AbbyPlugin, useFeatureFlags, __abby__ } = createTestAbby();

    const { result } = withSetup(() => useFeatureFlags(), AbbyPlugin, {
      initialData,
    });

    expect(result.value).toEqual([
      { name: "flag1", value: true },
      { name: "flag2", value: false },
    ]);

    __abby__.updateFlag("flag2", true);
    await nextTick();

    expect(result.value).toEqual([
      { name: "flag1", value: true },
      { name: "flag2", value: true },
    ]);
  });
});

describe("useRemoteConfig", () => {
  it("returns the remote config values", () => {
    const { AbbyPlugin, useRemoteConfig } = createTestAbby();

    const { result } = withSetup(
      () => ({
        text: useRemoteConfig("text"),
        count: useRemoteConfig("count"),
      }),
      AbbyPlugin,
      { initialData }
    );

    expect(result.text.value).toBe("Hello");
    expect(result.count.value).toBe(42);
  });

  it("uses the default values until the data is loaded", () => {
    const { AbbyPlugin, useRemoteConfig } = createAbby({
      projectId: "123",
      environments: [""],
      currentEnvironment: "",
      remoteConfig: { text: "String" },
      settings: { remoteConfig: { defaultValues: { String: "Default" } } },
    });

    const { result } = withSetup(() => useRemoteConfig("text"), AbbyPlugin);

    expect(result.value).toBe("Default");
  });

  it("uses the devOverrides in development", () => {
    process.env.NODE_ENV = "development";
    const { AbbyPlugin, useRemoteConfig } = createAbby({
      projectId: "123",
      environments: [""],
      currentEnvironment: "",
      remoteConfig: { text: "String" },
      settings: { remoteConfig: { devOverrides: { text: "Overridden" } } },
    });

    const { result } = withSetup(() => useRemoteConfig("text"), AbbyPlugin, {
      initialData,
    });

    expect(result.value).toBe("Overridden");
  });

  it("updates when a value changes", async () => {
    const { AbbyPlugin, useRemoteConfig, __abby__ } = createTestAbby();

    const { result } = withSetup(() => useRemoteConfig("text"), AbbyPlugin, {
      initialData,
    });

    __abby__.updateRemoteConfig("text", "Changed");
    await nextTick();

    expect(result.value).toBe("Changed");
  });

  it("returns all variables with useRemoteConfigVariables", () => {
    const { AbbyPlugin, useRemoteConfigVariables } = createTestAbby();

    const { result } = withSetup(() => useRemoteConfigVariables(), AbbyPlugin, {
      initialData,
    });

    expect(result.value).toEqual([
      { name: "text", value: "Hello" },
      { name: "count", value: 42 },
    ]);
  });
});

describe("AbbyPlugin", () => {
  it("unsubscribes from the core when the app is unmounted", () => {
    const { AbbyPlugin, useFeatureFlag, __abby__ } = createTestAbby();
    const unsubscribe = vi.fn();
    vi.spyOn(__abby__, "subscribe").mockReturnValue(unsubscribe);

    const { wrapper } = withSetup(() => useFeatureFlag("flag1"), AbbyPlugin, {
      initialData,
    });
    expect(__abby__.subscribe).toHaveBeenCalledTimes(1);

    wrapper.unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("applies the cookie overrides once the data is loaded", async () => {
    // the API returns `true` for flag1, the override (e.g. from the devtools) says `false`
    document.cookie = `${getFFStorageKey("123", "flag1")}=false`;
    const { AbbyPlugin, useFeatureFlag, __abby__ } = createTestAbby();
    const loadSpy = vi.spyOn(__abby__, "loadProjectData");

    const { result } = withSetup(() => {
      const flag1 = useFeatureFlag("flag1");
      // a sync watcher reads the value at the moment the core notifies,
      // which is before the overrides are applied
      watch(flag1, () => {}, { flush: "sync" });
      return flag1;
    }, AbbyPlugin);
    await vi.waitFor(() => expect(loadSpy).toHaveBeenCalledTimes(1));
    await loadSpy.mock.results[0]?.value;

    expect(result.value).toBe(false);
  });
});

describe("helpers", () => {
  it("returns the values without a component", () => {
    const {
      __abby__,
      getFeatureFlagValue,
      getRemoteConfig,
      getABTestValue,
      getVariants,
    } = createTestAbby();
    __abby__.init(initialData);

    expect(getFeatureFlagValue("flag1")).toBe(true);
    expect(getRemoteConfig("text")).toBe("Hello");
    expect(getVariants("test")).toEqual(["A", "B", "C"]);
    expect(["A", "B", "C"]).toContain(getABTestValue("test"));
    expect(["a", "b", "c"]).toContain(
      getABTestValue("test", { A: "a", B: "b", C: "c" })
    );
  });

  it("resets a test with getABResetFunction", () => {
    setStoredVariant("123", "test", "B");
    const { getABResetFunction } = createTestAbby();

    getABResetFunction("test")();

    expect(document.cookie).not.toContain("_test=B");
  });
});

describe("withDevtools", () => {
  const createFactory = () => {
    const destroy = vi.fn();
    const factory = { create: vi.fn(() => destroy) };
    return { factory, destroy };
  };

  it("creates the devtools on mount and destroys them on unmount", () => {
    const { withDevtools } = createTestAbby();
    const { factory, destroy } = createFactory();

    const wrapper = mount(
      withDevtools(factory as any, { dangerouslyForceShow: true })
    );
    expect(factory.create).toHaveBeenCalledTimes(1);

    wrapper.unmount();
    expect(destroy).toHaveBeenCalledTimes(1);
  });

  it("does not show the devtools outside of development", () => {
    process.env.NODE_ENV = "production";
    const { withDevtools } = createTestAbby();
    const { factory } = createFactory();

    mount(withDevtools(factory as any));

    expect(factory.create).not.toHaveBeenCalled();
  });
});
