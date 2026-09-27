import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { createAbby } from "../src";

describe("useRemoteConfig", () => {
  it("returns the value of the remote config", async () => {
    const { AbbyProvider, useRemoteConfig } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      remoteConfig: { remoteConfig1: "String" },
    });

    const Child = defineComponent({
      setup() {
        const value = useRemoteConfig("remoteConfig1");

        expectTypeOf(value.value).toEqualTypeOf<string>();

        return () => h("div", value.value);
      },
    });

    const wrapper = mount(AbbyProvider, {
      slots: { default: () => h(Child) },
    });

    await flushPromises();

    expect(wrapper.text()).toBe("FooBar");
  });

  it("falls back to the default values of the config", () => {
    const { getRemoteConfig } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      remoteConfig: {
        numberConfig: "Number",
        jsonConfig: "JSON",
      },
      settings: {
        remoteConfig: {
          defaultValues: {
            Number: 10,
            JSON: { foo: "bar" },
          },
        },
      },
    });

    const number = getRemoteConfig("numberConfig");
    const json = getRemoteConfig("jsonConfig");

    expectTypeOf(number).toEqualTypeOf<number>();
    expectTypeOf(json).toEqualTypeOf<Record<string, unknown>>();

    expect(number).toBe(10);
    expect(json).toEqual({ foo: "bar" });
  });

  it("returns the default value for remote configs which are not on the server", async () => {
    const { AbbyProvider, useRemoteConfig } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      remoteConfig: { numberConfig: "Number" },
      settings: { remoteConfig: { defaultValues: { Number: 10 } } },
    });

    const Child = defineComponent({
      setup() {
        const value = useRemoteConfig("numberConfig");

        expectTypeOf(value.value).toEqualTypeOf<number>();

        return () => h("div", String(value.value));
      },
    });

    const wrapper = mount(AbbyProvider, {
      slots: { default: () => h(Child) },
    });

    await flushPromises();

    expect(wrapper.text()).toBe("10");
  });
});

describe("useRemoteConfigVariables", () => {
  it("returns all remote config variables", async () => {
    const { AbbyProvider, useRemoteConfigVariables } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      remoteConfig: { remoteConfig1: "String" },
    });

    const Child = defineComponent({
      setup() {
        const variables = useRemoteConfigVariables();

        return () =>
          h("div", variables.value.map((variable) => variable.name).join(","));
      },
    });

    const wrapper = mount(AbbyProvider, {
      slots: { default: () => h(Child) },
    });

    await flushPromises();

    expect(wrapper.text()).toBe("remoteConfig1");
  });
});
