import { AbbyEventType, HttpService } from "@tryabby/core";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp, defineComponent, h, nextTick } from "vue";
import { createAbby } from "../src";
import { TestStorageService } from "../src/StorageService";

const OLD_ENV = process.env;

beforeEach(() => {
  document.cookie = "";
  vi.restoreAllMocks();
  vi.resetModules();
  process.env = { ...OLD_ENV };
});

afterAll(() => {
  process.env = OLD_ENV;
});

describe("useAbby & Vue Integration", () => {
  it("resolves a variant and sets storage", async () => {
    const spy = vi.spyOn(TestStorageService, "set");

    const { useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["OldFooter", "NewFooter"] },
      },
    });

    const { variant } = useAbby("test");

    expect(spy).toHaveBeenCalled();
    expect(variant.value).toBeDefined();
    expect(["OldFooter", "NewFooter"]).toContain(variant.value);
  });

  it("uses the persisted cookie value", async () => {
    const persistedValue = "SimonsText";
    const variants = ["SimonsText", "MatthiasText", "TomsText", "TimsText"];

    const getSpy = vi.spyOn(TestStorageService, "get");
    const setSpy = vi.spyOn(TestStorageService, "set");

    getSpy.mockReturnValue(persistedValue);

    const { useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants },
      },
    });

    const { variant } = useAbby("test");

    expect(setSpy).not.toHaveBeenCalled();
    expect(variant.value).toEqual(persistedValue);
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

    const { useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants },
      },
    });

    const { variant } = useAbby("test", {
      SimonsText: "MappedSimon",
      MatthiasText: "MappedMatthias",
      TomsText: "MappedTom",
      TimsText: "MappedTim",
    });

    expect(variant.value).toEqual("MappedSimon");
  });

  it("sends an ACT event on onAct", async () => {
    const sendDataSpy = vi.spyOn(HttpService, "sendData");
    const persistedValue = "SimonsText";

    const getSpy = vi.spyOn(TestStorageService, "get");
    getSpy.mockReturnValue(persistedValue);

    const { useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "proj_abc",
      apiUrl: "https://api.tryabby.com",
      tests: {
        test: { variants: ["SimonsText", "TimsText"] },
      },
    });

    const { onAct } = useAbby("test");
    onAct();

    expect(sendDataSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AbbyEventType.ACT,
        data: {
          projectId: "proj_abc",
          selectedVariant: "SimonsText",
          testName: "test",
        },
      })
    );
  });

  it("evaluates feature flags with useFeatureFlag and useFeatureFlags", async () => {
    const { useFeatureFlag, useFeatureFlags, AbbyProvider } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      flags: {
        flag1: "Boolean",
        flag2: "Boolean",
      },
    });

    let flagVal = false;
    let flagsList: Array<{ name: string; value: boolean }> = [];

    const Consumer = defineComponent({
      setup() {
        const f1 = useFeatureFlag("flag1");
        const allFlags = useFeatureFlags();
        flagVal = f1.value;
        flagsList = allFlags.value;
        return () => h("div");
      },
    });

    const App = defineComponent({
      render() {
        return h(
          AbbyProvider,
          {
            initialData: {
              tests: [],
              flags: [
                { name: "flag1", value: true },
                { name: "flag2", value: false },
              ],
              remoteConfig: [],
            },
          },
          { default: () => h(Consumer) }
        );
      },
    });

    const app = createApp(App);
    const container = document.createElement("div");
    app.mount(container);

    expect(flagVal).toBe(true);
    expect(flagsList).toEqual([
      { name: "flag1", value: true },
      { name: "flag2", value: false },
    ]);
  });

  it("evaluates remote config with useRemoteConfig and useRemoteConfigVariables", async () => {
    const { useRemoteConfig, useRemoteConfigVariables, AbbyProvider } =
      createAbby({
        environments: [""],
        currentEnvironment: "",
        projectId: "123",
        remoteConfig: {
          banner: "String",
        },
      });

    let bannerVal = "";
    let rcList: Array<{ name: string; value: string }> = [];

    const Consumer = defineComponent({
      setup() {
        const b = useRemoteConfig("banner");
        const all = useRemoteConfigVariables();
        bannerVal = b.value;
        rcList = all.value;
        return () => h("div");
      },
    });

    const App = defineComponent({
      render() {
        return h(
          AbbyProvider,
          {
            initialData: {
              tests: [],
              flags: [],
              remoteConfig: [{ name: "banner", value: "Welcome to Abby!" }],
            },
          },
          { default: () => h(Consumer) }
        );
      },
    });

    const app = createApp(App);
    const container = document.createElement("div");
    app.mount(container);

    expect(bannerVal).toBe("Welcome to Abby!");
    expect(rcList).toEqual([{ name: "banner", value: "Welcome to Abby!" }]);
  });

  it("supports AbbyPlugin installation on a Vue app", async () => {
    const { useFeatureFlag, AbbyPlugin } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      flags: {
        featureX: "Boolean",
      },
    });

    let resolvedFlag = false;

    const Component = defineComponent({
      setup() {
        const flag = useFeatureFlag("featureX");
        resolvedFlag = flag.value;
        return () => h("span", String(resolvedFlag));
      },
    });

    const app = createApp(Component);
    app.use(AbbyPlugin, {
      initialData: {
        tests: [],
        flags: [{ name: "featureX", value: true }],
        remoteConfig: [],
      },
    });

    const container = document.createElement("div");
    app.mount(container);

    expect(resolvedFlag).toBe(true);
  });

  it("provides direct synchronous access functions", () => {
    const {
      getFeatureFlagValue,
      getRemoteConfig,
      getABTestValue,
      getVariants,
      getABResetFunction,
    } = createAbby({
      environments: [],
      currentEnvironment: "production",
      projectId: "sync_test",
      tests: {
        theme: { variants: ["light", "dark"] },
      },
      flags: {
        beta: "Boolean",
      },
      remoteConfig: {
        timeout: "Number",
      },
    });

    const removeSpy = vi.spyOn(TestStorageService, "remove");
    const reset = getABResetFunction("theme");
    reset();
    expect(removeSpy).toHaveBeenCalledWith("sync_test", "theme");

    const variants = getVariants("theme");
    expect(variants).toEqual(["light", "dark"]);

    const themeVariant = getABTestValue("theme", {
      light: "DayMode",
      dark: "NightMode",
    });
    expect(["DayMode", "NightMode"]).toContain(themeVariant);
  });
});
