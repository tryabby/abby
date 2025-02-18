import { defineComponent, Fragment, h, VNode } from 'vue'
import { renderToString } from 'vue/server-renderer';
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

    const ComponentWithFF = defineComponent({
      setup() {
        const { variant } = useAbby("showFooter");
        return { variant }
      },
      render() {
        const slots: VNode[] = []
        /* @ts-ignore this is just the types for SSR */
        this.variant === "" && slots.push(h('span', {}, 'SSR!'))
        this.variant === "current" && slots.push(h('span', { "data-testid": "current" }, "Secret"))
        this.variant === "new" && slots.push(h('span', { "data-testid": "new" }, "Very Secret"))
        return h(Fragment, {}, slots)
      }
    });

    const serverSideDOM = await renderToString(h(AbbyProvider, {
      initialData: {
        flags: [],
        tests: [
          {
            name: "showFooter",
            weights: [0.5, 0.5],
          },
        ],
        remoteConfig: [],
      }
    }, { default: () => h(ComponentWithFF) }))

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
        return { test, test2 }
      },
      render() {
        const slots: VNode[] = []
        this.test && slots.push(h('span', { "data-testid": "test" }, "Secret"))
        this.test2 && slots.push(h('span', { "data-testid": "test2" }, "SUPER SECRET"))
        return h(Fragment, {}, slots)
      }
    })
    const serverSideDOM = await renderToString(
      h(AbbyProvider, {
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
        }
      }, { default: () => h(ComponentWithFF) })
    );

    expect(serverSideDOM).toContain("Secret");
    expect(serverSideDOM).not.toContain("SUPER SECRET");
  });
});

describe("getRemoteConfig", () => {
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
        return { remoteConfig1 }
      },
      render() {
        return h('span', { "data-testid": "test" }, this.remoteConfig1)
      }
    });

    const serverSideDOM = await renderToString(
      h(AbbyProvider, {
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
        }
      }, { default: () => h(ComponentWithRC) })
    );
    expect(serverSideDOM).toContain("FooBar");
  });
});
