import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "@vue/server-renderer";
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
  it("does not render a variant on the server", async () => {
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
            // @ts-expect-error this is just the types for SSR
            variant.value === "" ? h("span", "SSR!") : null,
            variant.value === "current"
              ? h("span", { "data-testid": "current" }, "Secret")
              : null,
            variant.value === "new"
              ? h("span", { "data-testid": "new" }, "Very Secret")
              : null,
          ]);
      },
    });

    const app = createSSRApp({
      render: () =>
        h(
          AbbyProvider,
          {
            initialData: {
              flags: [],
              tests: [
                {
                  name: "showFooter",
                  weights: [0.5, 0.5],
                },
              ],
              remoteConfig: [],
            },
          },
          {
            default: () => h(ComponentWithTest),
          }
        ),
    });

    const serverSideHTML = await renderToString(app);

    expect(serverSideHTML).toContain("SSR!");
    expect(serverSideHTML).not.toContain("Secret");
    expect(serverSideHTML).not.toContain("Very Secret");
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
            test.value
              ? h("span", { "data-testid": "test" }, "Secret")
              : null,
            test2.value
              ? h("span", { "data-testid": "test2" }, "SUPER SECRET")
              : null,
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
          },
          {
            default: () => h(ComponentWithFF),
          }
        ),
    });

    const serverSideHTML = await renderToString(app);

    expect(serverSideHTML).toContain("Secret");
    expect(serverSideHTML).not.toContain("SUPER SECRET");
  });
});

describe("useRemoteConfig", () => {
  it("renders the correct remoteConfig value on the server", async () => {
    const { AbbyProvider, useRemoteConfig } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      remoteConfig: { remoteConfig1: "String" },
    });

    const ComponentWithRC = defineComponent({
      setup() {
        const remoteConfig1 = useRemoteConfig("remoteConfig1");
        return () =>
          h("div", [
            h("span", { "data-testid": "test" }, String(remoteConfig1.value)),
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
              remoteConfig: [{ name: "remoteConfig1", value: "FooBar" }],
            },
          },
          {
            default: () => h(ComponentWithRC),
          }
        ),
    });

    const serverSideHTML = await renderToString(app);

    expect(serverSideHTML).toContain("FooBar");
  });
});
