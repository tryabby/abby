import { renderToString } from "@vue/server-renderer";
import { createApp, defineComponent, h } from "vue";
import { createAbby } from "../src";

const OLD_ENV = process.env;

beforeEach(() => {
  vi.resetModules(); // Most important - it clears the cache
  process.env = { ...OLD_ENV }; // Make a copy
});

afterAll(() => {
  process.env = OLD_ENV; // Restore old environment
});

describe("useAbby", () => {
  it("doesn't render a variant on the server", async () => {
    const { AbbyVuePlugin, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "ssr-ab-test",
      tests: {
        showFooter: {
          variants: ["current", "new"],
        },
      },
    });

    const ComponentWithTest = defineComponent({
      setup() {
        const { variant } = useAbby("showFooter");
        return () => {
          // the server doesn't know which variant to render -> cast because
          // typescript doesn't know that the variant can be an empty string
          const selectedVariant = variant.value as string;
          return h("div", [
            selectedVariant === "" ? h("span", "SSR!") : null,
            selectedVariant === "current"
              ? h("span", { "data-testid": "current" }, "Secret")
              : null,
            selectedVariant === "new"
              ? h("span", { "data-testid": "new" }, "Very Secret")
              : null,
          ]);
        };
      },
    });

    // no initialData -> the server doesn't know which variant to render
    const app = createApp(ComponentWithTest);
    app.use(AbbyVuePlugin);
    const serverSideHTML = await renderToString(app);

    expect(serverSideHTML).toContain("SSR!");
    expect(serverSideHTML).not.toContain("data-testid=");
  });

  it("hydrates the variant from initialData on the server", async () => {
    const { AbbyVuePlugin, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "ssr-ab-hydrate",
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
            variant.value === "current"
              ? h("span", { "data-testid": "current" }, "Secret")
              : null,
            variant.value === "new"
              ? h("span", { "data-testid": "new" }, "Very Secret")
              : null,
          ]);
      },
    });

    const app = createApp(ComponentWithTest);
    app.use(AbbyVuePlugin, {
      initialData: {
        flags: [],
        tests: [
          {
            name: "showFooter",
            weights: [1, 0],
          },
        ],
        remoteConfig: [],
      },
    });
    const serverSideHTML = await renderToString(app);

    expect(serverSideHTML).toContain('data-testid="current"');
    expect(serverSideHTML).not.toContain("Very Secret");
  });
});

describe("useFeatureFlag", () => {
  it("renders the correct feature flag on the server", async () => {
    const { AbbyVuePlugin, useFeatureFlag } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "ssr-ff",
      flags: ["test", "test2"],
    });

    const ComponentWithFF = defineComponent({
      setup() {
        const test = useFeatureFlag("test");
        const test2 = useFeatureFlag("test2");

        return () =>
          h("div", [
            test.value ? h("span", { "data-testid": "test" }, "Secret") : null,
            test2.value
              ? h("span", { "data-testid": "test2" }, "SUPER SECRET")
              : null,
          ]);
      },
    });

    const app = createApp(ComponentWithFF);
    app.use(AbbyVuePlugin, {
      initialData: {
        flags: [
          {
            value: true,
            name: "test",
          },
          {
            value: false,
            name: "test2",
          },
        ],
        tests: [],
        remoteConfig: [],
      },
    });
    const serverSideHTML = await renderToString(app);

    expect(serverSideHTML).toContain("Secret");
    expect(serverSideHTML).not.toContain("SUPER SECRET");
  });
});

describe("useRemoteConfig", () => {
  it("renders the correct remoteConfig value on the server", async () => {
    const { AbbyVuePlugin, useRemoteConfig } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "ssr-rc",
      remoteConfig: { remoteConfig1: "String" },
    });

    const ComponentWithRC = defineComponent({
      setup() {
        const remoteConfig1 = useRemoteConfig("remoteConfig1");

        return () => h("span", { "data-testid": "test" }, remoteConfig1.value);
      },
    });

    const app = createApp(ComponentWithRC);
    app.use(AbbyVuePlugin, {
      initialData: {
        flags: [],
        tests: [],
        remoteConfig: [{ name: "remoteConfig1", value: "FooBar" }],
      },
    });
    const serverSideHTML = await renderToString(app);

    expect(serverSideHTML).toContain("FooBar");
  });
});
