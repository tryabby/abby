import { renderToString } from "@vue/server-renderer";
import { describe, expect, it } from "vitest";
import { createSSRApp, defineComponent, h } from "vue";
import { createAbby } from "../src";

describe("useAbby", () => {
  it("doesn't render a variant on the server", async () => {
    const { AbbyProvider, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        showFooter: {
          variants: ["current", "new"],
        },
      },
    });

    const ComponentWithTest = defineComponent({
      setup() {
        const { variant } = useAbby("showFooter");
        return () =>
          h("div", [
            // @ts-ignore the variant is an empty string before the component is mounted
            variant.value === "" ? "SSR!" : "",
            variant.value === "current" ? "Secret" : "",
            variant.value === "new" ? "Very Secret" : "",
          ]);
      },
    });

    const app = createSSRApp({
      render: () =>
        h(AbbyProvider, null, {
          default: () => h(ComponentWithTest),
        }),
    });

    const serverSideDOM = await renderToString(app);

    expect(serverSideDOM).toContain("SSR!");
    expect(serverSideDOM).not.toContain("Secret");
    expect(serverSideDOM).not.toContain("Very Secret");
  });
});

describe("useFeatureFlag", () => {
  it("renders the correct feature flag on the server", async () => {
    const { AbbyProvider, useFeatureFlag } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      flags: ["test", "test2"],
    });

    const ComponentWithFF = defineComponent({
      setup() {
        const test = useFeatureFlag("test");
        const test2 = useFeatureFlag("test2");
        return () =>
          h("div", [
            test.value ? "Secret" : "",
            test2.value ? "SUPER SECRET" : "",
          ]);
      },
    });

    const app = createSSRApp({
      render: () =>
        h(
          AbbyProvider,
          {
            initialData: {
              flags: [
                { value: true, name: "test" },
                { value: false, name: "test2" },
              ],
              tests: [],
              remoteConfig: [],
            },
          },
          { default: () => h(ComponentWithFF) }
        ),
    });

    const serverSideDOM = await renderToString(app);

    expect(serverSideDOM).toContain("Secret");
    expect(serverSideDOM).not.toContain("SUPER SECRET");
  });
});

describe("useRemoteConfig", () => {
  it("renders the correct remote config value on the server", async () => {
    const { AbbyProvider, useRemoteConfig } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      remoteConfig: { remoteConfig1: "String" },
    });

    const ComponentWithRC = defineComponent({
      setup() {
        const remoteConfig1 = useRemoteConfig("remoteConfig1");
        return () => h("div", [remoteConfig1.value]);
      },
    });

    const app = createSSRApp({
      render: () =>
        h(
          AbbyProvider,
          {
            initialData: {
              flags: [],
              tests: [],
              remoteConfig: [{ name: "remoteConfig1", value: "FooBar" }],
            },
          },
          { default: () => h(ComponentWithRC) }
        ),
    });

    const serverSideDOM = await renderToString(app);

    expect(serverSideDOM).toContain("FooBar");
  });
});
