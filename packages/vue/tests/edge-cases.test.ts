import { type AbbyDataResponse, HttpService } from "@tryabby/core";
import { mount } from "@vue/test-utils";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { type Component, defineComponent, h, nextTick } from "vue";
import { createAbby } from "../src";

const OLD_ENV = process.env;

beforeEach(() => {
  document.cookie = "";
  vi.resetModules();
  process.env = { ...OLD_ENV };
});

afterAll(() => {
  process.env = OLD_ENV;
});

function withTestComponent<T>(
  composable: () => T,
  AbbyProvider: Component,
  initialData?: AbbyDataResponse
): { result: T; wrapper: ReturnType<typeof mount> } {
  let result!: T;
  const Child = defineComponent({
    setup() {
      result = composable();
      return () => h("div");
    },
  });

  const wrapper = mount(
    defineComponent({
      setup() {
        return () =>
          h(AbbyProvider, { initialData }, { default: () => h(Child) });
      },
    })
  );

  return { result, wrapper };
}

describe("Abby Vue Edge Cases & Boundaries", () => {
  it("initializes synchronously with initialData via AbbyProvider", () => {
    const { AbbyProvider, useFeatureFlag, useRemoteConfig, useAbby } =
      createAbby({
        environments: ["production"],
        currentEnvironment: "production",
        projectId: "proj-edge",
        flags: ["earlyFlag"],
        remoteConfig: {
          bannerText: "String",
        },
        tests: {
          heroTest: { variants: ["VariantA", "VariantB"] },
        },
      });

    const initialData: AbbyDataResponse = {
      flags: [{ name: "earlyFlag", value: true }],
      remoteConfig: [{ name: "bannerText", value: "SSR Banner" }],
      tests: [{ name: "heroTest", weights: [1, 0] }],
    };

    let flagVal!: ReturnType<typeof useFeatureFlag>;
    let rcVal!: ReturnType<typeof useRemoteConfig>;
    let abbyVal!: ReturnType<typeof useAbby>;

    withTestComponent(
      () => {
        flagVal = useFeatureFlag("earlyFlag");
        rcVal = useRemoteConfig("bannerText");
        abbyVal = useAbby("heroTest");
      },
      AbbyProvider,
      initialData
    );

    expect(flagVal.value).toBe(true);
    expect(rcVal.value).toBe("SSR Banner");
    expect(["VariantA", "VariantB"]).toContain(abbyVal.variant.value);
  });

  it("initializes synchronously with initialData via AbbyPlugin", () => {
    const { AbbyPlugin, useFeatureFlag, useRemoteConfig } = createAbby({
      environments: ["production"],
      currentEnvironment: "production",
      projectId: "proj-plugin",
      flags: ["pluginFlag"],
      remoteConfig: {
        pluginConfig: "String",
      },
    });

    const initialData: AbbyDataResponse = {
      flags: [{ name: "pluginFlag", value: true }],
      remoteConfig: [{ name: "pluginConfig", value: "Plugin Text" }],
      tests: [],
    };

    let flagVal!: ReturnType<typeof useFeatureFlag>;
    let rcVal!: ReturnType<typeof useRemoteConfig>;

    const Child = defineComponent({
      setup() {
        flagVal = useFeatureFlag("pluginFlag");
        rcVal = useRemoteConfig("pluginConfig");
        return () => h("div");
      },
    });

    mount(Child, {
      global: {
        plugins: [[AbbyPlugin, { initialData }]],
      },
    });

    expect(flagVal.value).toBe(true);
    expect(rcVal.value).toBe("Plugin Text");
  });

  it("updates reactively when __abby__ data changes via subscribe", async () => {
    const { AbbyProvider, useFeatureFlag, useRemoteConfig, __abby__ } =
      createAbby({
        environments: ["production"],
        currentEnvironment: "production",
        projectId: "proj-reactive",
        flags: ["dynamicFlag"],
        remoteConfig: {
          counter: "Number",
        },
      });

    let flagVal!: ReturnType<typeof useFeatureFlag>;
    let rcVal!: ReturnType<typeof useRemoteConfig>;

    withTestComponent(() => {
      flagVal = useFeatureFlag("dynamicFlag");
      rcVal = useRemoteConfig("counter");
    }, AbbyProvider);

    expect(flagVal.value).toBe(false);

    // Simulate external data update (e.g. from devtools or re-fetch)
    __abby__.init({
      flags: [{ name: "dynamicFlag", value: true }],
      remoteConfig: [{ name: "counter", value: 42 }],
      tests: [],
    });

    await nextTick();

    expect(flagVal.value).toBe(true);
    expect(rcVal.value).toBe(42);
  });

  it("mounts and unmounts devtools cleanly in development mode", () => {
    process.env.NODE_ENV = "development";

    const { withDevtools } = createAbby({
      environments: ["dev"],
      currentEnvironment: "dev",
      projectId: "proj-dev",
    });

    const destroySpy = vi.fn();
    const createSpy = vi.fn().mockReturnValue(destroySpy);
    const mockFactory = {
      create: createSpy,
    };

    const DevtoolsComponent = withDevtools(mockFactory as any);

    const wrapper = mount(DevtoolsComponent);
    expect(createSpy).toHaveBeenCalled();

    wrapper.unmount();
    expect(destroySpy).toHaveBeenCalled();
  });

  it("omits devtools in production unless dangerouslyForceShow is true", () => {
    process.env.NODE_ENV = "production";

    const { withDevtools } = createAbby({
      environments: ["prod"],
      currentEnvironment: "prod",
      projectId: "proj-prod",
    });

    const destroySpy = vi.fn();
    const createSpy = vi.fn().mockReturnValue(destroySpy);
    const mockFactory = {
      create: createSpy,
    };

    // Without force: should NOT create
    const DevtoolsNoForce = withDevtools(mockFactory as any);
    mount(DevtoolsNoForce);
    expect(createSpy).not.toHaveBeenCalled();

    // With force: SHOULD create
    const DevtoolsForced = withDevtools(mockFactory as any, {
      dangerouslyForceShow: true,
    });
    mount(DevtoolsForced);
    expect(createSpy).toHaveBeenCalled();
  });

  it("handles missing or empty variants gracefully", () => {
    const { AbbyProvider, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "proj-empty",
      tests: {
        emptyTest: { variants: [] },
      },
    });

    const { result } = withTestComponent(
      () => useAbby("emptyTest"),
      AbbyProvider
    );

    // Calling onAct with empty variant should be safe and no-op
    const spy = vi.spyOn(HttpService, "sendData");
    result.onAct();
    expect(spy).not.toHaveBeenCalled();
  });

  it("isolates multiple createAbby instances from each other", () => {
    const abby1 = createAbby({
      environments: ["env1"],
      currentEnvironment: "env1",
      projectId: "proj-1",
      flags: ["flagA"],
    });

    const abby2 = createAbby({
      environments: ["env2"],
      currentEnvironment: "env2",
      projectId: "proj-2",
      flags: ["flagB"],
    });

    expect(abby1.__abby__.getConfig().projectId).toBe("proj-1");
    expect(abby2.__abby__.getConfig().projectId).toBe("proj-2");
    expect(abby1.getFeatureFlagValue("flagA")).toBe(false);
    expect(abby2.getFeatureFlagValue("flagB")).toBe(false);
  });
});
