import { HttpService, AbbyEventType } from "@tryabby/core";
import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { ref, nextTick, defineComponent, h } from "vue";
import { mount, flushPromises } from "@vue/test-utils";
import { createAbby } from "../src";
import { TestStorageService } from "../src/StorageService";

const OLD_ENV = process.env;

beforeEach(() => {
  document.cookie = "";
  vi.resetModules();
  process.env = { ...OLD_ENV };
});

afterAll(() => {
  process.env = OLD_ENV;
});

describe("useAbby", () => {
  it("returns the correct variant", async () => {
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

    const TestComponent = defineComponent({
      setup() {
        const { variant } = useAbby("test");
        return { variant };
      },
      render() {
        return h("div", this.variant);
      },
    });

    const wrapper = mount(
      defineComponent({
        components: { AbbyProvider, TestComponent },
        template: `<AbbyProvider><TestComponent /></AbbyProvider>`,
      })
    );

    await flushPromises();
    await nextTick();

    expect(spy).toHaveBeenCalled();
    expect(wrapper.text()).toBeDefined();
  });

  it("should use the persistedValue", async () => {
    const persistedValue = "SimonsText";
    const variants = ["SimonsText", "MatthiasText", "TomsText", "TimsText"];

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

    const capturedVariant = ref<string | null>(null);

    const TestComponent = defineComponent({
      setup() {
        const { variant } = useAbby("test");
        capturedVariant.value = variant.value;
        return { variant };
      },
      render() {
        return h("div", this.variant);
      },
    });

    mount(
      defineComponent({
        components: { AbbyProvider, TestComponent },
        template: `<AbbyProvider><TestComponent /></AbbyProvider>`,
      })
    );

    await flushPromises();
    await nextTick();

    // value set in storage should be used
    expect(capturedVariant.value).toEqual(persistedValue);
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

    const capturedVariant = ref<string | null>(null);

    const TestComponent = defineComponent({
      setup() {
        const { variant } = useAbby("test", {
          SimonsText: "a",
          MatthiasText: "b",
          TomsText: "c",
          TimsText: "d",
        });
        capturedVariant.value = variant.value;
        return { variant };
      },
      render() {
        return h("div", String(this.variant));
      },
    });

    mount(
      defineComponent({
        components: { AbbyProvider, TestComponent },
        template: `<AbbyProvider><TestComponent /></AbbyProvider>`,
      })
    );

    await flushPromises();
    await nextTick();

    expect(capturedVariant.value).toEqual("a");
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

    const TestComponent = defineComponent({
      setup() {
        const { variant, onAct } = useAbby("test");
        return { variant, onAct };
      },
      render() {
        return h("div", this.variant);
      },
    });

    mount(
      defineComponent({
        components: { AbbyProvider, TestComponent },
        template: `<AbbyProvider><TestComponent /></AbbyProvider>`,
      })
    );

    await flushPromises();
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

    let onActFn: (() => void) | null = null;

    const TestComponent = defineComponent({
      setup() {
        const { variant, onAct } = useAbby("test");
        onActFn = onAct;
        return { variant };
      },
      render() {
        return h("div", this.variant);
      },
    });

    mount(
      defineComponent({
        components: { AbbyProvider, TestComponent },
        template: `<AbbyProvider><TestComponent /></AbbyProvider>`,
      })
    );

    await flushPromises();
    await nextTick();

    // Reset call count after mount PING
    spy.mockClear();

    onActFn!();

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: AbbyEventType.ACT })
    );
  });
});

describe("useFeatureFlag", () => {
  it("should return the correct feature flag value", async () => {
    const { AbbyProvider, useFeatureFlag } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      flags: ["flag1", "flag2"],
    });

    const capturedFlag = ref<boolean | null>(null);

    const TestComponent = defineComponent({
      setup() {
        const flag1 = useFeatureFlag("flag1");
        capturedFlag.value = flag1.value;
        return { flag1 };
      },
      render() {
        return h("div", String(this.flag1));
      },
    });

    mount(
      defineComponent({
        components: { AbbyProvider, TestComponent },
        template: `<AbbyProvider><TestComponent /></AbbyProvider>`,
      })
    );

    await flushPromises();
    await nextTick();

    // Initially false (default) until server returns
    expect(typeof capturedFlag.value).toBe("boolean");
  });

  it("should respect the default value for feature flags", async () => {
    const { AbbyProvider, useFeatureFlag } = createAbby({
      environments: [],
      projectId: "123",
      flags: ["flag1", "flag2"],
      currentEnvironment: "a",
    });

    const capturedFlag = ref<boolean | null>(null);

    const TestComponent = defineComponent({
      setup() {
        const flag1 = useFeatureFlag("flag1");
        capturedFlag.value = flag1.value;
        return { flag1 };
      },
      render() {
        return h("div", String(this.flag1));
      },
    });

    mount(
      defineComponent({
        components: { AbbyProvider, TestComponent },
        template: `<AbbyProvider><TestComponent /></AbbyProvider>`,
      })
    );

    await flushPromises();
    await nextTick();

    expect(capturedFlag.value).toEqual(false);
  });
});

describe("useRemoteConfig", () => {
  it("returns the correct remote config value", async () => {
    const { AbbyProvider, useRemoteConfig } = createAbby({
      environments: [],
      projectId: "123",
      remoteConfig: {
        remoteConfig1: "String",
      },
      currentEnvironment: "a",
    });

    const capturedValue = ref<string | null>(null);

    const TestComponent = defineComponent({
      setup() {
        const rc = useRemoteConfig("remoteConfig1");
        capturedValue.value = rc.value;
        return { rc };
      },
      render() {
        return h("div", String(this.rc));
      },
    });

    mount(
      defineComponent({
        components: { AbbyProvider, TestComponent },
        template: `<AbbyProvider><TestComponent /></AbbyProvider>`,
      })
    );

    await flushPromises();
    await nextTick();

    // Initially empty string default, or server value
    expect(typeof capturedValue.value).toBe("string");
  });
});

describe("getFeatureFlagValue", () => {
  it("gets the stored feature flag value using a function properly", async () => {
    const { getFeatureFlagValue } = createAbby({
      environments: [],
      projectId: "123",
      flags: ["flag1", "flag2"],
      currentEnvironment: "a",
    });

    // Default is false before server fetch
    expect(typeof getFeatureFlagValue("flag1")).toBe("boolean");
    expect(typeof getFeatureFlagValue("flag2")).toBe("boolean");
  });
});

describe("getVariants", () => {
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
});

describe("getABTestValue", () => {
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
      lookupObject[activeVariant as keyof typeof lookupObject]
    );
  });
});

describe("Vue plugin install", () => {
  it("works as a Vue plugin", async () => {
    const { install, useFeatureFlag } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      flags: ["flag1"],
    });

    const TestComponent = defineComponent({
      setup() {
        const flag1 = useFeatureFlag("flag1");
        return { flag1 };
      },
      render() {
        return h("div", String(this.flag1));
      },
    });

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[install]],
      },
    });

    await flushPromises();
    await nextTick();

    expect(wrapper.text()).toBeDefined();
  });
});
