import { AbbyEventType, HttpService } from "@tryabby/core";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach } from "vitest";
import { defineComponent, h } from "vue";
import { createAbby } from "../src";
import { TestStorageService } from "../src/StorageService";

const OLD_ENV = process.env;

beforeEach(() => {
  document.cookie = "";
  vi.resetModules();
  vi.restoreAllMocks();
  process.env = { ...OLD_ENV };
});

afterAll(() => {
  process.env = OLD_ENV;
});

const abbyConfig = {
  environments: [""],
  currentEnvironment: "",
  projectId: "123",
  tests: {
    test: { variants: ["OldFooter", "NewFooter"] },
    test2: {
      variants: ["SimonsText", "MatthiasText", "TomsText", "TimsText"],
    },
  },
};

describe("useAbby", () => {
  it("returns the selected variant of the given test", async () => {
    const setSpy = vi.spyOn(TestStorageService, "set");

    const { AbbyProvider, useAbby } = createAbby(abbyConfig);

    const Child = defineComponent({
      setup() {
        const { variant } = useAbby("test");

        return () => h("div", variant.value);
      },
    });

    const wrapper = mount(AbbyProvider, {
      slots: { default: () => h(Child) },
    });

    await flushPromises();

    expect(setSpy).toHaveBeenCalled();
    expect(["OldFooter", "NewFooter"]).toContain(wrapper.text());
  });

  it("should use the persisted value", async () => {
    const persistedValue = "SimonsText";
    const getSpy = vi.spyOn(TestStorageService, "get");
    getSpy.mockReturnValue(persistedValue);

    const { AbbyProvider, useAbby } = createAbby(abbyConfig);

    const Child = defineComponent({
      setup() {
        const { variant } = useAbby("test2");
        return () => h("div", variant.value);
      },
    });

    const wrapper = mount(AbbyProvider, {
      slots: { default: () => h(Child) },
    });

    await flushPromises();

    expect(wrapper.text()).toBe(persistedValue);
  });

  it("looks the variant up in the lookup object", async () => {
    const getSpy = vi.spyOn(TestStorageService, "get");
    getSpy.mockReturnValue("OldFooter");

    const { AbbyProvider, useAbby } = createAbby(abbyConfig);

    const Child = defineComponent({
      setup() {
        const { variant } = useAbby("test", {
          OldFooter: "Retro",
          NewFooter: "Modern",
        });
        return () => h("div", variant.value);
      },
    });

    const wrapper = mount(AbbyProvider, {
      slots: { default: () => h(Child) },
    });

    await flushPromises();

    expect(wrapper.text()).toBe("Retro");
  });

  it("sends an act event when onAct is called", async () => {
    const getSpy = vi.spyOn(TestStorageService, "get");
    getSpy.mockReturnValue("SimonsText");
    const sendSpy = vi.spyOn(HttpService, "sendData");

    const { AbbyProvider, useAbby } = createAbby(abbyConfig);

    let onAct: (() => void) | undefined;

    const Child = defineComponent({
      setup() {
        const abbyTest = useAbby("test2");
        onAct = abbyTest.onAct;
        return () => h("div", abbyTest.variant.value);
      },
    });

    mount(AbbyProvider, { slots: { default: () => h(Child) } });

    await flushPromises();
    sendSpy.mockClear();

    onAct?.();

    expect(sendSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AbbyEventType.ACT,
        data: expect.objectContaining({
          projectId: "123",
          testName: "test2",
          selectedVariant: "SimonsText",
        }),
      })
    );
  });

  it("throws a helpful error when used outside of the provider", () => {
    const { useAbby } = createAbby(abbyConfig);

    const Child = defineComponent({
      setup() {
        useAbby("test");
        return () => h("div");
      },
    });

    expect(() => mount(Child)).toThrow(
      /useAbbyData must be used within an AbbyProvider/
    );
  });

  it("uses the initialData from the server instead of fetching", async () => {
    const { AbbyProvider, useAbby } = createAbby(abbyConfig);

    const Child = defineComponent({
      setup() {
        const { variant } = useAbby("test");
        return () => h("div", variant.value);
      },
    });

    const wrapper = mount(AbbyProvider, {
      props: {
        initialData: {
          tests: [{ name: "test", weights: [0, 1] }],
          flags: [],
          remoteConfig: [],
        },
      },
      slots: { default: () => h(Child) },
    });

    await flushPromises();

    expect(wrapper.text()).toBe("NewFooter");
  });
});
