import {
  type AbbyDataResponse,
  AbbyEventType,
  HttpService,
} from "@tryabby/core";
import Cookies from "js-cookie";
import {
  type App,
  createApp,
  createSSRApp,
  defineComponent,
  h,
  nextTick,
  onMounted,
  shallowRef,
} from "vue";
import { renderToString } from "vue/server-renderer";
import { createAbby } from "../src";

const initialData: AbbyDataResponse = {
  tests: [{ name: "checkout", weights: [0, 1] }],
  flags: [{ name: "banner", value: true }],
  remoteConfig: [
    { name: "title", value: "Welcome" },
    { name: "limit", value: 3 },
  ],
};
function configure(
  cookies: { disableByDefault?: boolean } = { disableByDefault: true }
) {
  return createAbby({
    projectId: "vue-tests",
    apiUrl: "http://127.0.0.1:9876/",
    currentEnvironment: "test",
    environments: ["test"],
    tests: { checkout: { variants: ["old", "new"] } },
    flags: ["banner", "missing"],
    remoteConfig: { title: "String", limit: "Number", missing: "String" },
    cookies,
    settings: {
      flags: { fallbackValues: { missing: true } },
      remoteConfig: { defaultValues: { String: "Default" } },
    },
    user: { customer: { type: "boolean" } },
  });
}
type Integration = ReturnType<typeof configure>;
const apps: App[] = [];
function mount<T>(abby: Integration, setup: () => T, data?: AbbyDataResponse) {
  let result!: T;
  const child = defineComponent({
    setup() {
      result = setup();
      return () => h("span", "consumer");
    },
  });
  const app = createApp({
    render: () => h(abby.AbbyProvider, { initialData: data }, () => h(child)),
  });
  apps.push(app);
  const element = document.createElement("div");
  app.mount(element);
  return { result, app, element };
}

beforeEach(() => {
  vi.spyOn(HttpService, "sendData").mockImplementation(() => undefined);
  vi.stubGlobal(
    "fetch",
    vi.fn().mockRejectedValue(new Error("Unexpected network request"))
  );
});
afterEach(() => {
  for (const app of apps.splice(0)) app.unmount();
  for (const cookie of document.cookie.split(";")) {
    document.cookie = `${cookie.split("=")[0].trim()}=; Max-Age=0; path=/`;
  }
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it("returns a weighted variant, lookup value, flags and typed config", async () => {
  const abby = configure();
  const { result } = mount(
    abby,
    () => ({
      test: abby.useAbby("checkout"),
      lookup: abby.useAbby("checkout", { old: 1, new: 2 }),
      flag: abby.useFeatureFlag("banner"),
      title: abby.useRemoteConfig("title"),
      limit: abby.useRemoteConfig("limit"),
    }),
    initialData
  );
  await nextTick();
  expect(result.test.variant.value).toBe("new");
  expect(result.lookup.variant.value).toBe(2);
  expect(result.flag.value).toBe(true);
  expect(result.title.value).toBe("Welcome");
  expect(result.limit.value).toBe(3);
  expect(fetch).not.toHaveBeenCalled();
});

it("hydrates server data without a variant or text mismatch", async () => {
  function createPage() {
    const abby = configure();
    const child = defineComponent({
      setup() {
        const flag = abby.useFeatureFlag("banner");
        const title = abby.useRemoteConfig("title");
        const { variant } = abby.useAbby("checkout");
        return () =>
          h("p", `${flag.value}|${title.value}|${variant.value ?? "pending"}`);
      },
    });
    return createSSRApp({
      render: () => h(abby.AbbyProvider, { initialData }, () => h(child)),
    });
  }
  const element = document.createElement("div");
  element.innerHTML = await renderToString(createPage());
  expect(element.textContent).toBe("true|Welcome|pending");
  const app = createPage();
  const warning = vi.fn();
  app.config.warnHandler = warning;
  apps.push(app);
  app.mount(element);
  await nextTick();
  expect(element.textContent).toBe("true|Welcome|new");
  expect(warning).not.toHaveBeenCalled();
  expect(fetch).not.toHaveBeenCalled();
});

it("tracks each rendered variant and its conversion", async () => {
  const abby = configure();
  const { result } = mount(abby, () => abby.useAbby("checkout"), initialData);
  await nextTick();
  expect(HttpService.sendData).toHaveBeenCalledOnce();
  expect(HttpService.sendData).toHaveBeenCalledWith({
    url: "http://127.0.0.1:9876/",
    type: AbbyEventType.PING,
    data: {
      projectId: "vue-tests",
      testName: "checkout",
      selectedVariant: "new",
    },
  });
  result.onAct();
  expect(HttpService.sendData).toHaveBeenLastCalledWith(
    expect.objectContaining({ type: AbbyEventType.ACT })
  );
});

it("updates every composable after core subscription events", async () => {
  vi.stubEnv("NODE_ENV", "development");
  const abby = configure();
  const { result } = mount(
    abby,
    () => ({
      test: abby.useAbby("checkout"),
      flag: abby.useFeatureFlag("banner"),
      title: abby.useRemoteConfig("title"),
      flags: abby.useFeatureFlags(),
      variables: abby.useRemoteConfigVariables(),
    }),
    initialData
  );
  await nextTick();
  abby.__abby__.updateLocalVariant("checkout", "old");
  abby.__abby__.updateFlag("banner", false);
  abby.__abby__.updateRemoteConfig("title", "Changed");
  await nextTick();
  expect(result.test.variant.value).toBe("old");
  expect(result.flag.value).toBe(false);
  expect(result.title.value).toBe("Changed");
  expect(result.flags.value).toContainEqual({ name: "banner", value: false });
  expect(result.variables.value).toContainEqual({
    name: "title",
    value: "Changed",
  });
  expect(HttpService.sendData).toHaveBeenLastCalledWith(
    expect.objectContaining({
      type: AbbyEventType.PING,
      data: expect.objectContaining({ selectedVariant: "old" }),
    })
  );
});

it("uses core fallbacks when the API omits a configured key", () => {
  const abby = configure();
  const { result } = mount(
    abby,
    () => ({
      flag: abby.useFeatureFlag("missing"),
      remote: abby.useRemoteConfig("missing"),
    }),
    initialData
  );
  expect(result.flag.value).toBe(true);
  expect(result.remote.value).toBe("Default");
});

it("fetches once on mount, waits for weights, and updates the initial view", async () => {
  let resolve!: (value: Response) => void;
  vi.mocked(fetch).mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      })
  );
  const abby = configure();
  const { result } = mount(abby, () => ({
    test: abby.useAbby("checkout"),
    flag: abby.useFeatureFlag("banner"),
  }));
  expect(result.test.variant.value).toBeUndefined();
  result.test.onAct();
  expect(HttpService.sendData).not.toHaveBeenCalled();
  expect(result.flag.value).toBe(false);
  expect(fetch).toHaveBeenCalledOnce();
  expect(fetch).toHaveBeenCalledWith(
    "http://127.0.0.1:9876/api/v2/data/vue-tests?environment=test"
  );
  resolve(new Response(JSON.stringify(initialData)));
  await vi.waitFor(() => expect(result.test.variant.value).toBe("new"));
  expect(result.flag.value).toBe(true);
});

it("keeps defaults when the project request fails", async () => {
  vi.mocked(fetch).mockResolvedValue(
    new Response("Unavailable", { status: 503 })
  );
  const abby = configure();
  const { result } = mount(abby, () => ({
    test: abby.useAbby("checkout"),
    title: abby.useRemoteConfig("title"),
  }));
  await vi.waitFor(() => expect(result.test.variant.value).toBe("old"));
  expect(result.title.value).toBe("Default");
});

it("unsubscribes and stops tracking when the provider unmounts", async () => {
  const abby = configure();
  const subscribe = abby.__abby__.subscribe.bind(abby.__abby__);
  const removed = vi.fn();
  vi.spyOn(abby.__abby__, "subscribe").mockImplementation((listener) => {
    const unsubscribe = subscribe(listener);
    return () => {
      removed();
      unsubscribe();
    };
  });
  const { result, app } = mount(
    abby,
    () => abby.useAbby("checkout"),
    initialData
  );
  await nextTick();
  app.unmount();
  apps.splice(apps.indexOf(app), 1);
  vi.mocked(HttpService.sendData).mockClear();
  abby.__abby__.updateFlag("banner", false);
  result.onAct();
  await nextTick();
  expect(removed).toHaveBeenCalledOnce();
  expect(HttpService.sendData).not.toHaveBeenCalled();
});

it("ignores an outstanding load after unmount", async () => {
  let resolve!: (value: Response) => void;
  vi.mocked(fetch).mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      })
  );
  const abby = configure();
  const { result, app } = mount(abby, () => abby.useAbby("checkout"));
  app.unmount();
  apps.splice(apps.indexOf(app), 1);
  resolve(new Response(JSON.stringify(initialData)));
  await new Promise((done) => setTimeout(done, 0));
  expect(result.variant.value).toBeUndefined();
  expect(HttpService.sendData).not.toHaveBeenCalled();
});

it("does not let a retired provider's request overwrite its replacement", async () => {
  let resolve!: (value: Response) => void;
  vi.mocked(fetch).mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      })
  );
  const abby = configure();
  const first = mount(abby, () => abby.useRemoteConfig("title"));
  first.app.unmount();
  apps.splice(apps.indexOf(first.app), 1);
  const second = mount(abby, () => abby.useRemoteConfig("title"), initialData);
  expect(second.result.value).toBe("Welcome");
  resolve(
    new Response(
      JSON.stringify({
        ...initialData,
        remoteConfig: [{ name: "title", value: "Stale" }],
      })
    )
  );
  await new Promise((done) => setTimeout(done, 0));
  expect(second.result.value).toBe("Welcome");
  expect(abby.getRemoteConfig("title")).toBe("Welcome");
});

it("tracks late consumers and stops conversions after only the consumer unmounts", async () => {
  const abby = configure();
  const visible = shallowRef(false);
  let onAct!: () => void;
  const child = defineComponent({
    setup() {
      onAct = abby.useAbby("checkout").onAct;
      return () => h("p", "Checkout");
    },
  });
  const app = createApp({
    render: () =>
      h(abby.AbbyProvider, { initialData }, () =>
        visible.value ? h(child) : null
      ),
  });
  apps.push(app);
  app.mount(document.createElement("div"));
  await nextTick();
  expect(HttpService.sendData).not.toHaveBeenCalled();
  visible.value = true;
  await nextTick();
  expect(HttpService.sendData).toHaveBeenCalledOnce();
  expect(HttpService.sendData).toHaveBeenLastCalledWith(
    expect.objectContaining({ type: AbbyEventType.PING })
  );
  onAct();
  expect(HttpService.sendData).toHaveBeenCalledTimes(2);
  visible.value = false;
  await nextTick();
  onAct();
  expect(HttpService.sendData).toHaveBeenCalledTimes(2);
});

it.each(["useAbby", "useFeatureFlag", "useRemoteConfig"] as const)(
  "explains a missing provider for %s",
  (method) => {
    const abby = configure();
    const error = vi.fn();
    const app = createApp({
      setup: () => {
        if (method === "useAbby") abby.useAbby("checkout");
        if (method === "useFeatureFlag") abby.useFeatureFlag("banner");
        if (method === "useRemoteConfig") abby.useRemoteConfig("title");
        return () => null;
      },
      render: () => null,
    });
    app.config.errorHandler = error;
    apps.push(app);
    app.mount(document.createElement("div"));
    expect(error.mock.calls[0][0].message).toContain("inside the AbbyProvider");
  }
);

it("does not accept the provider from a different factory", () => {
  const first = configure();
  const second = configure();
  const error = vi.fn();
  const child = defineComponent({
    setup() {
      second.useFeatureFlag("banner");
    },
    render: () => null,
  });
  const app = createApp({
    render: () => h(first.AbbyProvider, { initialData }, () => h(child)),
  });
  app.config.errorHandler = error;
  apps.push(app);
  app.mount(document.createElement("div"));
  expect(error.mock.calls[0][0].message).toContain("same createAbby");
});

it("persists the variant in the same cookie format as other integrations", async () => {
  const abby = createAbby({
    projectId: "cookies",
    currentEnvironment: "test",
    environments: ["test"],
    tests: { checkout: { variants: ["old", "new"] } },
  });
  // The provider helper is deliberately narrow; this instance only differs in config.
  const app = createApp({
    render: () => h(abby.AbbyProvider, { initialData }, () => h("div")),
  });
  apps.push(app);
  app.mount(document.createElement("div"));
  expect(document.cookie).toContain("__abby__ab__cookies_checkout=new");
  expect(abby.getABTestValue("checkout")).toBe("new");
  abby.getABResetFunction("checkout")();
  expect(document.cookie).not.toContain("__abby__ab__cookies_checkout=");
});

it.each([false, true])(
  "reads saved refusal before cookie writes (existing variant: %s)",
  async (existing) => {
    if (existing) document.cookie = "__abby__ab__consent_checkout=old; path=/";
    document.cookie = "__abby__ab__consent_$_abcc_$=false; path=/";
    const writeCookie = vi.spyOn(Cookies, "set");
    let resolve!: (value: Response) => void;
    vi.mocked(fetch).mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        })
    );
    const abby = createAbby({
      projectId: "consent",
      currentEnvironment: "test",
      environments: ["test"],
      tests: { checkout: { variants: ["old", "new"] } },
    });
    let value!: ReturnType<typeof abby.useAbby>;
    const child = defineComponent({
      setup() {
        value = abby.useAbby("checkout");
        return () => null;
      },
    });
    const app = createApp({
      render: () => h(abby.AbbyProvider, {}, () => h(child)),
    });
    apps.push(app);
    app.mount(document.createElement("div"));
    expect(writeCookie).not.toHaveBeenCalled();
    resolve(new Response(JSON.stringify(initialData)));
    await vi.waitFor(() =>
      expect(value.variant.value).toBe(existing ? "old" : "new")
    );
    expect(writeCookie).not.toHaveBeenCalled();
    if (!existing)
      expect(document.cookie).not.toContain("__abby__ab__consent_checkout=");
  }
);

it.each([false, true])(
  "restores opt-in after consent is removed on remount (retained variant: %s)",
  async (retainVariant) => {
    const consentKey = "__abby__ab__vue-tests_$_abcc_$";
    const variantKey = "__abby__ab__vue-tests_checkout";
    Cookies.set(consentKey, "true");
    const abby = configure();
    const first = mount(abby, () => abby.useAbby("checkout"), initialData);
    await nextTick();
    expect(Cookies.get(variantKey)).toBe("new");
    first.app.unmount();

    Cookies.remove(consentKey);
    if (!retainVariant) Cookies.remove(variantKey);
    const writeCookie = vi.spyOn(Cookies, "set");
    const second = mount(abby, () => abby.useAbby("checkout"), initialData);
    await nextTick();
    expect(second.result.variant.value).toBe("new");
    expect(writeCookie).not.toHaveBeenCalled();
    expect(abby.__abby__.getConfig().cookies?.disableByDefault).toBe(true);
    expect(Cookies.get(consentKey)).toBeUndefined();
    expect(Cookies.get(variantKey)).toBe(retainVariant ? "new" : undefined);

    // An explicit new grant must work in this provider and survive remounting.
    abby.__abby__.enableCookies();
    expect(Cookies.get(consentKey)).toBe("true");
    expect(Cookies.get(variantKey)).toBe("new");
    second.app.unmount();
    Cookies.remove(variantKey);
    mount(abby, () => abby.useAbby("checkout"), initialData);
    await nextTick();
    expect(Cookies.get(variantKey)).toBe("new");
    expect(abby.__abby__.getConfig().cookies?.disableByDefault).toBe(false);
  }
);

it("honors a saved refusal when remounting a previously consenting factory", async () => {
  const consentKey = "__abby__ab__vue-tests_$_abcc_$";
  Cookies.set(consentKey, "true");
  const abby = configure();
  const first = mount(abby, () => abby.useAbby("checkout"), initialData);
  first.app.unmount();
  Cookies.set(consentKey, "false");
  const writeCookie = vi.spyOn(Cookies, "set");
  mount(abby, () => abby.useAbby("checkout"), initialData);
  await nextTick();
  expect(writeCookie).not.toHaveBeenCalled();
  expect(abby.__abby__.getConfig().cookies?.disableByDefault).toBe(true);
});

it.each([{}, { disableByDefault: false }])(
  "preserves default-allow and explicit disabling on remount (%j)",
  async (cookies) => {
    const variantKey = "__abby__ab__vue-tests_checkout";
    const abby = configure(cookies);
    const first = mount(abby, () => abby.useAbby("checkout"), initialData);
    expect(Cookies.get(variantKey)).toBe("new");
    first.app.unmount();
    Cookies.remove(variantKey);
    const second = mount(abby, () => abby.useAbby("checkout"), initialData);
    expect(Cookies.get(variantKey)).toBe("new");

    abby.__abby__.disableCookies();
    second.app.unmount();
    Cookies.remove(variantKey);
    const writeCookie = vi.spyOn(Cookies, "set");
    mount(abby, () => abby.useAbby("checkout"), initialData);
    await nextTick();
    expect(writeCookie).not.toHaveBeenCalled();
    expect(Cookies.get(variantKey)).toBeUndefined();
    expect(abby.__abby__.getConfig().cookies?.disableByDefault).toBe(true);
  }
);

it("respects disabled cookies and applies typed user targeting updates", async () => {
  const abby = configure();
  const data: AbbyDataResponse = {
    ...initialData,
    flags: [
      {
        name: "banner",
        value: false,
        ruleSet: [
          {
            propertyName: "customer",
            propertyType: "boolean",
            operator: "eq",
            value: true,
            thenValue: true,
          },
        ],
      },
    ],
  };
  const { result } = mount(abby, () => abby.useFeatureFlag("banner"), data);
  expect(result.value).toBe(false);
  abby.updateUserProperties({ customer: true });
  await nextTick();
  expect(result.value).toBe(true);
  expect(document.cookie).not.toContain("__abby__ab__vue-tests");
});

it("observes targeting updates from a child's mount hook", async () => {
  const abby = configure();
  const data: AbbyDataResponse = {
    ...initialData,
    flags: [
      {
        name: "banner",
        value: false,
        ruleSet: [
          {
            propertyName: "customer",
            propertyType: "boolean",
            operator: "eq",
            value: true,
            thenValue: true,
          },
        ],
      },
    ],
  };
  const child = defineComponent({
    setup() {
      const flag = abby.useFeatureFlag("banner");
      onMounted(() => abby.updateUserProperties({ customer: true }));
      return () => h("p", String(flag.value));
    },
  });
  const app = createApp({
    render: () => h(abby.AbbyProvider, { initialData: data }, () => h(child)),
  });
  apps.push(app);
  const element = document.createElement("div");
  app.mount(element);
  await nextTick();
  expect(abby.getFeatureFlagValue("banner")).toBe(true);
  expect(element.textContent).toBe("true");
});
