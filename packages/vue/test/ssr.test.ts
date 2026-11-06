import { HttpService, getABStorageKey } from "@tryabby/core";
import * as v from "@tryabby/core/validation";
import { renderToString } from "@vue/server-renderer";
import { createApp, createSSRApp, defineComponent, h } from "vue";
import { createAbby } from "../src";
import { TestStorageService } from "../src/StorageService";

const OLD_ENV = process.env;

async function runOnServer<T>(fn: () => Promise<T> | T): Promise<T> {
  const originalWindow = globalThis.window;
  // Simulate Node.js SSR where window is undefined
  Object.defineProperty(globalThis, "window", {
    value: undefined,
    configurable: true,
    writable: true,
  });
  try {
    return await fn();
  } finally {
    Object.defineProperty(globalThis, "window", {
      value: originalWindow,
      configurable: true,
      writable: true,
    });
  }
}

beforeEach(() => {
  document.cookie.split(";").forEach((cookie) => {
    document.cookie = cookie
      .replace(/^ +/, "")
      .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
  });
  vi.restoreAllMocks();
  vi.resetModules();
  process.env = { ...OLD_ENV };
});

afterAll(() => {
  process.env = OLD_ENV;
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

    const serverSideHTML = await runOnServer(async () => {
      const app = createApp(ComponentWithTest);
      app.use(AbbyVuePlugin);
      return await renderToString(app);
    });

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

    const serverSideHTML = await runOnServer(async () => {
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
      return await renderToString(app);
    });

    expect(serverSideHTML).toContain('data-testid="current"');
    expect(serverSideHTML).not.toContain("Very Secret");
  });

  it("hydrates on the browser client for a first visit without existing cookies and isolates concurrent SSR renders", async () => {
    const { AbbyVuePlugin, useAbby, useFeatureFlag } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "ssr-ab-first-visit",
      flags: ["beta"],
      tests: {
        showFooter: {
          variants: ["current", "new"],
        },
      },
    });

    const Component = defineComponent({
      setup() {
        const { variant } = useAbby("showFooter");
        const beta = useFeatureFlag("beta");
        return () =>
          h("div", `${variant.value as string}:${beta.value ? "on" : "off"}`);
      },
    });

    const initialDataA: any = {
      flags: [{ name: "beta", value: true }],
      tests: [{ name: "showFooter", weights: [0.5, 0.5] }],
      remoteConfig: [],
    };
    const initialDataB: any = {
      flags: [{ name: "beta", value: false }],
      tests: [{ name: "showFooter", weights: [0, 1] }],
      remoteConfig: [],
    };

    const [htmlA, htmlB] = await runOnServer(async () => {
      const appA = createSSRApp(Component);
      appA.use(AbbyVuePlugin, { initialData: initialDataA });

      const appB = createSSRApp(Component);
      appB.use(AbbyVuePlugin, { initialData: initialDataB });

      return await Promise.all([renderToString(appA), renderToString(appB)]);
    });

    expect(htmlB).toContain("new:off");
    const chosenVariantA = initialDataA.selectedVariants?.showFooter;
    expect(["current", "new"]).toContain(chosenVariantA);
    expect(htmlA).toContain(`${chosenVariantA}:on`);
    expect(
      TestStorageService.get("ssr-ab-first-visit", "showFooter")
    ).toBeNull();

    // Hydrate into a real browser DOM container on the client
    const container = document.createElement("div");
    container.innerHTML = htmlA;

    const clientApp = createSSRApp(Component);
    clientApp.use(AbbyVuePlugin, {
      initialData: {
        ...initialDataA,
        tests: [
          {
            name: "showFooter",
            weights: chosenVariantA === "current" ? [0, 1] : [1, 0],
          },
        ],
      },
    });
    clientApp.mount(container);

    expect(container.textContent).toBe(`${chosenVariantA}:on`);
    expect(TestStorageService.get("ssr-ab-first-visit", "showFooter")).toBe(
      chosenVariantA
    );
    clientApp.unmount();
  });

  it("hydrates on the browser client when an existing request cookie is present", async () => {
    const projectId = "ssr-ab-existing-cookie";
    vi.spyOn(HttpService, "getProjectData").mockResolvedValue({
      flags: [],
      tests: [{ name: "showFooter", weights: [0, 1] }],
      remoteConfig: [],
    });

    const { AbbyVuePlugin, useAbby, withAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId,
      tests: {
        showFooter: {
          variants: ["current", "new"],
        },
      },
    });

    const Component = defineComponent({
      setup() {
        const { variant } = useAbby("showFooter");
        return () => h("div", variant.value as string);
      },
    });

    const cookieKey = getABStorageKey(projectId, "showFooter");
    const cookieHeader = `${cookieKey}=current`;

    const { serverHtml, initialData } = await runOnServer(async () => {
      const loader = withAbby(async () => ({ ok: true }));
      const payload = await loader({
        node: { req: { headers: { cookie: cookieHeader } } },
      });
      const serverApp = createSSRApp(Component);
      serverApp.use(AbbyVuePlugin, { initialData: payload.__abby__data! });
      const html = await renderToString(serverApp);
      return { serverHtml: html, initialData: payload.__abby__data! };
    });

    expect(serverHtml).toContain("current");
    expect(initialData.selectedVariants?.showFooter).toBe("current");

    // Browser client already has the cookie and hydrates the server HTML
    TestStorageService.set(projectId, "showFooter", "current");
    const container = document.createElement("div");
    container.innerHTML = serverHtml;

    const clientApp = createSSRApp(Component);
    clientApp.use(AbbyVuePlugin, { initialData });
    clientApp.mount(container);

    expect(container.textContent).toBe("current");
    clientApp.unmount();
  });

  it("hydrates on the browser client with cookies.disableByDefault enabled", async () => {
    const projectId = "ssr-ab-disabled-cookies";
    vi.spyOn(HttpService, "getProjectData").mockResolvedValue({
      flags: [],
      tests: [{ name: "showFooter", weights: [0, 1] }],
      remoteConfig: [],
    });

    const { AbbyVuePlugin, useAbby, withAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId,
      cookies: { disableByDefault: true },
      tests: {
        showFooter: {
          variants: ["current", "new"],
        },
      },
    });

    const Component = defineComponent({
      setup() {
        const { variant } = useAbby("showFooter");
        return () => h("div", variant.value as string);
      },
    });

    const cookieKey = getABStorageKey(projectId, "showFooter");
    // Even if a stale cookie says "current", disabled cookies must ignore it and use highest weight ("new")
    TestStorageService.set(projectId, "showFooter", "current");

    const { serverHtml, initialData } = await runOnServer(async () => {
      const loader = withAbby();
      const payload = await loader({
        node: { req: { headers: { cookie: `${cookieKey}=current` } } },
      });
      const serverApp = createSSRApp(Component);
      serverApp.use(AbbyVuePlugin, { initialData: payload.__abby__data! });
      const html = await renderToString(serverApp);
      return { serverHtml: html, initialData: payload.__abby__data! };
    });

    expect(serverHtml).toContain("new");
    expect(initialData.selectedVariants).toBeUndefined();

    const container = document.createElement("div");
    container.innerHTML = serverHtml;

    const clientApp = createSSRApp(Component);
    clientApp.use(AbbyVuePlugin, { initialData });
    clientApp.mount(container);

    expect(container.textContent).toBe("new");
    clientApp.unmount();
  });

  it("clears both cookie and in-memory variant when getABResetFunction is called", async () => {
    const projectId = "ssr-ab-reset";
    const { AbbyVuePlugin, getABTestValue, getABResetFunction } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId,
      tests: {
        showFooter: {
          variants: ["current", "new"],
        },
      },
    });

    const container = document.createElement("div");
    const app = createApp(defineComponent({ render: () => h("div") }));
    app.use(AbbyVuePlugin, {
      initialData: {
        flags: [],
        tests: [{ name: "showFooter", weights: [0, 1] }],
        remoteConfig: [],
        selectedVariants: { showFooter: "current" },
      },
    });
    app.mount(container);

    expect(getABTestValue("showFooter")).toBe("current");
    expect(TestStorageService.get(projectId, "showFooter")).toBe("current");

    const resetShowFooter = getABResetFunction("showFooter");
    resetShowFooter();

    expect(TestStorageService.get(projectId, "showFooter")).toBeNull();
    // Next lookup draws using weights [0, 1] ("new") instead of returning stale "current"
    expect(getABTestValue("showFooter")).toBe("new");
    app.unmount();
  });

  it("scopes updateUserProperties per SSR request without leaking across requests", async () => {
    vi.spyOn(HttpService, "getProjectData").mockResolvedValue({
      flags: [
        {
          name: "proFeature",
          value: false,
          ruleSet: [
            {
              propertyName: "plan",
              propertyType: "string",
              operator: "eq",
              value: "pro",
              thenValue: true,
            },
          ],
        },
      ],
      tests: [],
      remoteConfig: [],
    });

    const { AbbyVuePlugin, useFeatureFlag, withAbby, getFeatureFlagValue } =
      createAbby({
        environments: [""],
        currentEnvironment: "",
        projectId: "ssr-user-props",
        flags: ["proFeature"],
        user: {
          plan: v.string(),
        },
      });

    const Component = defineComponent({
      setup() {
        const pro = useFeatureFlag("proFeature");
        return () => h("div", pro.value ? "PRO" : "FREE");
      },
    });

    const [htmlPro, htmlFree] = await runOnServer(async () => {
      const proLoader = withAbby(async (_event, helpers) => {
        helpers?.updateUserProperties({ plan: "pro" });
        return {};
      });
      const freeLoader = withAbby(async (_event, helpers) => {
        helpers?.updateUserProperties({ plan: "free" });
        return {};
      });

      const [proPayload, freePayload] = await Promise.all([
        proLoader(),
        freeLoader(),
      ]);

      const appPro = createSSRApp(Component);
      appPro.use(AbbyVuePlugin, { initialData: proPayload.__abby__data! });

      const appFree = createSSRApp(Component);
      appFree.use(AbbyVuePlugin, { initialData: freePayload.__abby__data! });

      return await Promise.all([
        renderToString(appPro),
        renderToString(appFree),
      ]);
    });

    expect(htmlPro).toContain("PRO");
    expect(htmlFree).toContain("FREE");
    expect(getFeatureFlagValue("proFeature")).toBe(false);
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
