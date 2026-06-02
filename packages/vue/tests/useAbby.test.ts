import { AbbyEventType, HttpService } from "@tryabby/core";
import { mount } from "@vue/test-utils";
import { defineComponent, h, nextTick } from "vue";
import { createAbby } from "../src";
import { TestStorageService } from "../src/StorageService";

describe("useAbby", () => {
  it("returns a variant ref and onAct handler", async () => {
    const { AbbyProvider, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["OldFooter", "NewFooter"] },
      },
    });

    let variantValue = "";
    let hasOnAct = false;

    const Child = defineComponent({
      setup() {
        const { variant, onAct } = useAbby("test");
        variantValue = variant.value;
        hasOnAct = typeof onAct === "function";
        return () => h("span", variant.value);
      },
    });

    mount(AbbyProvider, {
      slots: {
        default: () => h(Child),
      },
    });

    await nextTick();

    expect(variantValue).toBeDefined();
    expect(hasOnAct).toBe(true);
  });

  it("uses a persisted test value", () => {
    const persistedValue = "SimonsText";
    const getSpy = vi.spyOn(TestStorageService, "get");
    const setSpy = vi.spyOn(TestStorageService, "set");
    getSpy.mockReturnValue(persistedValue);

    const { AbbyProvider, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: {
          variants: ["SimonsText", "MatthiasText", "TomsText", "TimsText"],
        },
      },
    });

    let variantValue = "";

    const Child = defineComponent({
      setup() {
        const { variant } = useAbby("test");
        variantValue = variant.value;
        return () => h("span", variant.value);
      },
    });

    mount(AbbyProvider, {
      slots: {
        default: () => h(Child),
      },
    });

    expect(setSpy).not.toHaveBeenCalled();
    expect(getSpy).toHaveBeenCalled();
    expect(variantValue).toEqual(persistedValue);
  });

  it("supports lookup objects", () => {
    const getSpy = vi.spyOn(TestStorageService, "get");
    getSpy.mockReturnValue("SimonsText");

    const { AbbyProvider, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: {
          variants: ["SimonsText", "MatthiasText", "TomsText", "TimsText"],
        },
      },
    });

    let variantValue = "";

    const Child = defineComponent({
      setup() {
        const { variant } = useAbby("test", {
          SimonsText: "a",
          MatthiasText: "b",
          TomsText: "c",
          TimsText: "d",
        });
        variantValue = variant.value;
        return () => h("span", variant.value);
      },
    });

    mount(AbbyProvider, {
      slots: {
        default: () => h(Child),
      },
    });

    expect(variantValue).toBe("a");
  });

  it("notifies the server with onAct", () => {
    const spy = vi.spyOn(HttpService, "sendData");
    const { AbbyProvider, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["A", "B", "C"] },
      },
    });

    const Child = defineComponent({
      setup() {
        const { onAct } = useAbby("test");
        onAct();
        return () => h("span");
      },
    });

    mount(AbbyProvider, {
      slots: {
        default: () => h(Child),
      },
    });

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: AbbyEventType.ACT })
    );
  });
});
