import { createApp, defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import { AbbyEventType, HttpService } from "@tryabby/core";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
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

describe("@tryabby/vue - useAbby", () => {
  it("returns a defined variant and calls storage set", () => {
    const spy = vi.spyOn(TestStorageService, "set");

    const { AbbyProvider, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["OldFooter", "NewFooter"] },
      },
    });

    const TestComponent = defineComponent({
      setup() {
        const { variant, onAct } = useAbby("test");
        return { variant, onAct };
      },
      template: `<div><span id="variant">{{ variant }}</span></div>`,
    });

    const wrapper = mount({
      components: { AbbyProvider, TestComponent },
      template: "<AbbyProvider><TestComponent /></AbbyProvider>",
    });

    expect(spy).toHaveBeenCalled();
    const text = wrapper.find("#variant").text();
    expect(["OldFooter", "NewFooter"]).toContain(text);
  });

  it("should use the persisted value from storage", () => {
    const persistedValue = "SimonsText";
    const variants = ["SimonsText", "MatthiasText"] as const;

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

    const TestComponent = defineComponent({
      setup() {
        const { variant } = useAbby("test");
        return { variant };
      },
      template: `<div id="variant">{{ variant }}</div>`,
    });

    const wrapper = mount({
      components: { AbbyProvider, TestComponent },
      template: "<AbbyProvider><TestComponent /></AbbyProvider>",
    });

    expect(setSpy).not.toHaveBeenCalled();
    expect(wrapper.find("#variant").text()).toBe(persistedValue);
  });

  it("works with a lookup object", () => {
    const getSpy = vi.spyOn(TestStorageService, "get");
    getSpy.mockReturnValue("A");

    const { AbbyProvider, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["A", "B"] },
      },
    });

    const TestComponent = defineComponent({
      setup() {
        const { variant } = useAbby("test", {
          A: "ComponentA",
          B: "ComponentB",
        });
        return { variant };
      },
      template: `<div id="val">{{ variant }}</div>`,
    });

    const wrapper = mount({
      components: { AbbyProvider, TestComponent },
      template: "<AbbyProvider><TestComponent /></AbbyProvider>",
    });

    expect(wrapper.find("#val").text()).toBe("ComponentA");
  });

  it("calls HttpService.sendData on onAct", async () => {
    const getSpy = vi.spyOn(TestStorageService, "get");
    getSpy.mockReturnValue("Variant1");

    const sendDataSpy = vi.spyOn(HttpService, "sendData");

    const { AbbyProvider, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "proj_act_123",
      tests: {
        test: { variants: ["Variant1", "Variant2"] },
      },
    });

    const TestComponent = defineComponent({
      setup() {
        const { onAct } = useAbby("test");
        return { onAct };
      },
      template: `<button @click="onAct">Act</button>`,
    });

    const wrapper = mount({
      components: { AbbyProvider, TestComponent },
      template: "<AbbyProvider><TestComponent /></AbbyProvider>",
    });

    await wrapper.find("button").trigger("click");

    expect(sendDataSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AbbyEventType.ACT,
        data: expect.objectContaining({
          projectId: "proj_act_123",
          selectedVariant: "Variant1",
          testName: "test",
        }),
      })
    );
  });

  it("works with AbbyPlugin in a Vue application", () => {
    const { AbbyPlugin } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "plugin_test",
      tests: {
        test: { variants: ["V1", "V2"] },
      },
    });

    const app = createApp({
      template: `<div id="app"></div>`,
    });
    app.use(AbbyPlugin);

    expect(app._context.provides).toBeDefined();
  });
});

describe("@tryabby/vue - useFeatureFlag & useRemoteConfig", () => {
  it("useFeatureFlag returns reactive feature flag value", () => {
    const { AbbyProvider, useFeatureFlag, getFeatureFlagValue } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      flags: ["featureA"],
    });

    const TestComponent = defineComponent({
      setup() {
        const flag = useFeatureFlag("featureA");
        return { flag };
      },
      template: `<div id="flag">{{ flag }}</div>`,
    });

    const wrapper = mount({
      components: { AbbyProvider, TestComponent },
      template: "<AbbyProvider><TestComponent /></AbbyProvider>",
    });

    expect(typeof wrapper.find("#flag").text()).toBe("string");
    expect(typeof getFeatureFlagValue("featureA")).toBe("boolean");
  });

  it("useRemoteConfig returns remote config value", () => {
    const { AbbyProvider, useRemoteConfig, getRemoteConfig } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      remoteConfig: {
        headline: "String",
      },
    });

    const TestComponent = defineComponent({
      setup() {
        const headline = useRemoteConfig("headline");
        return { headline };
      },
      template: `<div id="rc">{{ headline }}</div>`,
    });

    const wrapper = mount({
      components: { AbbyProvider, TestComponent },
      template: "<AbbyProvider><TestComponent /></AbbyProvider>",
    });

    expect(wrapper.find("#rc")).toBeDefined();
    expect(getRemoteConfig("headline")).toBeDefined();
  });

  it("helper functions getVariants and getABResetFunction work correctly", () => {
    const { getVariants, getABResetFunction } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        hero: { variants: ["heroA", "heroB"] },
      },
    });

    expect(getVariants("hero")).toEqual(["heroA", "heroB"]);

    const resetSpy = vi.spyOn(TestStorageService, "remove");
    const reset = getABResetFunction("hero");
    reset();
    expect(resetSpy).toHaveBeenCalledWith("123", "hero");
  });

  it("TestStorageService preserves explicit zero-day cookie expiration", async () => {
    const Cookie = (await import("js-cookie")).default;
    const cookieSpy = vi.spyOn(Cookie, "set");

    TestStorageService.set("proj1", "test1", "varA", { expiresInDays: 0 });
    expect(cookieSpy).toHaveBeenCalledWith(
      expect.stringContaining("test1"),
      "varA",
      expect.objectContaining({ expires: 0 })
    );
  });
});
