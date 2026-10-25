import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { createAbby } from "../src";

const OLD_ENV = process.env;

beforeEach(() => {
  vi.resetModules();
  process.env = { ...OLD_ENV };
});

afterAll(() => {
  process.env = OLD_ENV;
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
        return () =>
          h("div", [
            (variant.value as string) === "" ? h("span", "SSR!") : null,
            variant.value === "current"
              ? h("span", { "data-testid": "current" }, "Secret")
              : null,
            variant.value === "new"
              ? h("span", { "data-testid": "new" }, "Very Secret")
              : null,
          ]);
      },
    });

    const App = defineComponent({
      setup() {
        return () =>
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
            { default: () => h(ComponentWithFF) }
          );
      },
    });

    const serverSideDOM = await renderToString(createSSRApp(App));

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
            test.value ? h("span", { "data-testid": "test" }, "Secret") : null,
            test2.value
              ? h("span", { "data-testid": "test2" }, "SUPER SECRET")
              : null,
          ]);
      },
    });

    const App = defineComponent({
      setup() {
        return () =>
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
            { default: () => h(ComponentWithFF) }
          );
      },
    });

    const serverSideDOM = await renderToString(createSSRApp(App));

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

        return () => h("span", { "data-testid": "test" }, remoteConfig1.value);
      },
    });

    const App = defineComponent({
      setup() {
        return () =>
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
            { default: () => h(ComponentWithRC) }
          );
      },
    });

    const serverSideDOM = await renderToString(createSSRApp(App));

    expect(serverSideDOM).toContain("FooBar");
  });
});

describe("SSR user properties and configuration isolation", () => {
  it("applies user properties to targetAbby before init evaluates flag rules in SSR", async () => {
    const { AbbyProvider, useFeatureFlag } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      flags: ["betaFeature"],
      user: {
        role: { type: "string" as const },
      },
    });

    const ComponentWithFlag = defineComponent({
      setup() {
        const beta = useFeatureFlag("betaFeature");
        return () => h("span", { "data-testid": "beta" }, beta.value ? "ENABLED" : "DISABLED");
      },
    });

    const initialData = {
      flags: [
        {
          name: "betaFeature",
          value: false,
          ruleSet: [
            {
              operator: "and" as const,
              thenValue: true,
              rules: [
                {
                  propertyName: "role",
                  operator: "eq" as const,
                  value: "admin",
                  propertyType: "string" as const,
                },
              ],
            },
          ],
        },
      ],
      tests: [],
      remoteConfig: [],
    };

    const AppWithAdmin = defineComponent({
      setup() {
        return () =>
          h(
            AbbyProvider,
            {
              initialData,
              user: { role: "admin" },
            },
            { default: () => h(ComponentWithFlag) }
          );
      },
    });

    const AppWithUser = defineComponent({
      setup() {
        return () =>
          h(
            AbbyProvider,
            {
              initialData,
              user: { role: "viewer" },
            },
            { default: () => h(ComponentWithFlag) }
          );
      },
    });

    const domAdmin = await renderToString(createSSRApp(AppWithAdmin));
    expect(domAdmin).toContain("ENABLED");

    const domUser = await renderToString(createSSRApp(AppWithUser));
    expect(domUser).toContain("DISABLED");
  });

  it("does not mutate shared config cookies across SSR renders", async () => {
    const config = {
      environments: [""],
      currentEnvironment: "",
      projectId: "test_proj",
      tests: {
        heroTest: {
          variants: ["A", "B"],
        },
      },
      cookies: {
        disableByDefault: true,
      },
    };

    const { AbbyProvider, useAbby } = createAbby(config);

    const TestComp = defineComponent({
      setup() {
        const { variant } = useAbby("heroTest");
        return () => h("span", (variant.value as string) || "none");
      },
    });

    const AppWithConsent = defineComponent({
      setup() {
        return () =>
          h(
            AbbyProvider,
            {
              cookies: "test_proj_$_abcc_$=true",
              initialData: {
                flags: [],
                tests: [{ name: "heroTest", weights: [0.5, 0.5] }],
                remoteConfig: [],
              },
            },
            { default: () => h(TestComp) }
          );
      },
    });

    await renderToString(createSSRApp(AppWithConsent));

    // Verify original config.cookies.disableByDefault was NOT mutated
    expect(config.cookies.disableByDefault).toBe(true);
  });

  it("does not leak updateUserProperties across SSR requests", async () => {
    const { AbbyProvider, useFeatureFlag, updateUserProperties } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "leak_test",
      flags: ["adminOnly"],
      user: {
        role: { type: "string" as const },
      },
    });

    const FlagComp = defineComponent({
      setup() {
        const flag = useFeatureFlag("adminOnly");
        return () => h("span", flag.value ? "ADMIN_ENABLED" : "ADMIN_DISABLED");
      },
    });

    const initialData = {
      flags: [
        {
          name: "adminOnly",
          value: false,
          ruleSet: [
            {
              operator: "and" as const,
              thenValue: true,
              rules: [
                {
                  propertyName: "role",
                  operator: "eq" as const,
                  value: "admin",
                  propertyType: "string" as const,
                },
              ],
            },
          ],
        },
      ],
      tests: [],
      remoteConfig: [],
    };

    // Calling updateUserProperties during SSR should be a no-op and never pollute module state
    const originalWindow = global.window;
    try {
      delete (global as any).window;
      updateUserProperties({ role: "admin" });
    } finally {
      (global as any).window = originalWindow;
    }

    // Subsequent SSR render without user prop must NOT inherit the admin role
    const AppWithoutUser = defineComponent({
      setup() {
        return () =>
          h(
            AbbyProvider,
            { initialData },
            { default: () => h(FlagComp) }
          );
      },
    });

    const dom = await renderToString(createSSRApp(AppWithoutUser));
    expect(dom).toContain("ADMIN_DISABLED");
  });
});
