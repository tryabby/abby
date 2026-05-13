import { AbbyEventType, HttpService } from "@tryabby/core";
import { createApp, defineComponent, h, nextTick } from "vue";
import { createAbby } from "../src";
import { TestStorageService } from "../src/StorageService";

const mountWithAbby = (
  component: ReturnType<typeof defineComponent>,
  plugin: any
) => {
  const element = document.createElement("div");
  const app = createApp(component);
  app.use(plugin);
  app.mount(element);
  return app;
};

beforeEach(() => {
  document.cookie = "";
  vi.resetModules();
});

describe("useAbby", () => {
  it("returns the selected variant", async () => {
    const spy = vi.spyOn(TestStorageService, "set");

    const { AbbyPlugin, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["OldFooter", "NewFooter"] },
      },
    });

    let variant = "";
    const component = defineComponent({
      setup() {
        const result = useAbby("test");
        variant = result.variant.value;
        return () => h("div");
      },
    });

    mountWithAbby(component, AbbyPlugin);
    await nextTick();

    expect(spy).toHaveBeenCalled();
    expect(variant).toBeDefined();
  });

  it("looks up the selected variant in the lookup object", () => {
    const persistedValue = "SimonsText";
    vi.spyOn(TestStorageService, "get").mockReturnValue(persistedValue);

    const { AbbyPlugin, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: {
          variants: ["SimonsText", "MatthiasText", "TomsText", "TimsText"],
        },
      },
    });

    let variant = "";
    const component = defineComponent({
      setup() {
        const result = useAbby("test", {
          SimonsText: "a",
          MatthiasText: "b",
          TomsText: "c",
          TimsText: "d",
        });
        variant = result.variant.value;
        return () => h("div");
      },
    });

    mountWithAbby(component, AbbyPlugin);

    expect(variant).toEqual("a");
  });

  it("notifies the server on mount and onAct", async () => {
    const spy = vi.spyOn(HttpService, "sendData");

    const { AbbyPlugin, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        test: { variants: ["A", "B", "C"] },
      },
    });

    let onAct = () => {};
    const component = defineComponent({
      setup() {
        const result = useAbby("test");
        onAct = result.onAct;
        return () => h("div");
      },
    });

    mountWithAbby(component, AbbyPlugin);
    await nextTick();
    onAct();

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: AbbyEventType.PING })
    );
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: AbbyEventType.ACT })
    );
  });
});

describe("useFeatureFlag", () => {
  it("returns feature flag values", () => {
    const { AbbyPlugin, useFeatureFlag } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      flags: ["flag1", "flag2"],
    });

    let flag1 = false;
    let flag2 = true;
    const component = defineComponent({
      setup() {
        flag1 = useFeatureFlag("flag1").value;
        flag2 = useFeatureFlag("flag2").value;
        return () => h("div");
      },
    });

    mountWithAbby(component, AbbyPlugin);

    expect(flag1).toEqual(false);
    expect(flag2).toEqual(false);
  });
});

describe("useRemoteConfig", () => {
  it("returns remote config values", () => {
    const { AbbyPlugin, useRemoteConfig } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      remoteConfig: {
        remoteConfig1: "String",
      },
      settings: {
        remoteConfig: {
          defaultValues: {
            String: "defaultValue",
          },
        },
      },
    });

    let remoteConfig = "";
    const component = defineComponent({
      setup() {
        remoteConfig = useRemoteConfig("remoteConfig1").value;
        return () => h("div");
      },
    });

    mountWithAbby(component, AbbyPlugin);

    expect(remoteConfig).toEqual("defaultValue");
  });
});
