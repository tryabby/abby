import {
  Abby,
  AbbyEventType,
  HttpService,
  getABStorageKey,
} from "@tryabby/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createApp,
  createSSRApp,
  defineComponent,
  h,
  nextTick,
  ref,
} from "vue";
import { renderToString } from "vue/server-renderer";
import { createAbby } from "../index";

const make = () =>
  createAbby({
    projectId: "vue-tests",
    apiUrl: "http://localhost/",
    currentEnvironment: "production",
    environments: ["production"],
    tests: {
      heading: { variants: ["a", "b"] },
      button: { variants: ["a", "b"] },
    },
    flags: ["banner"],
    remoteConfig: { title: "String", limit: "Number", options: "JSON" },
    cookies: { disableByDefault: true },
  });
const data = () => ({
  tests: [
    { name: "heading", weights: [1, 0] },
    { name: "button", weights: [0, 1] },
  ],
  flags: [{ name: "banner", value: true }],
  remoteConfig: [
    { name: "title", value: "Hello" },
    { name: "limit", value: 7 },
    { name: "options", value: { enabled: true } },
  ],
});
const cleanup: Array<() => void> = [];
function mount<T>(
  api: ReturnType<typeof make>,
  use: () => T,
  initialData: ReturnType<typeof data> | null = data()
) {
  let value!: T;
  const child = defineComponent({
    setup() {
      value = use();
      return () => h("span");
    },
  });
  const root = document.createElement("div");
  document.body.append(root);
  const app = createApp({
    render: () =>
      h(
        api.AbbyProvider,
        { initialData: initialData ?? undefined },
        { default: () => h(child) }
      ),
  });
  app.mount(root);
  const unmount = () => {
    app.unmount();
    root.remove();
  };
  cleanup.push(unmount);
  return {
    get value() {
      return value;
    },
    unmount,
  };
}
beforeEach(() => {
  for (const cookie of document.cookie.split(";")) {
    document.cookie = `${cookie.split("=")[0]}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  }
});
afterEach(() => {
  cleanup.splice(0).forEach((dispose) => dispose());
  vi.restoreAllMocks();
});

describe("Vue integration with actual core", () => {
  it("hydrates server markup before exposing the client variant", async () => {
    const api = make();
    const child = defineComponent({
      setup() {
        const { variant } = api.useAbby("heading");
        return () => h("span", variant.value ?? "pending");
      },
    });
    const component = {
      render: () =>
        h(
          api.AbbyProvider,
          { initialData: data() },
          { default: () => h(child) }
        ),
    };
    const root = document.createElement("div");
    root.innerHTML = await renderToString(createSSRApp(component));
    expect(root.textContent).toBe("pending");
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const app = createSSRApp(component);
    app.mount(root);
    cleanup.push(() => app.unmount());
    await nextTick();
    expect(root.textContent).toBe("a");
    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it("uses core defaults if the project fetch fails", async () => {
    vi.spyOn(HttpService, "getProjectData").mockResolvedValue(null);
    const api = make();
    const mounted = mount(
      api,
      () => ({
        ready: api.useAbbyStatus(),
        test: api.useAbby("heading"),
        flag: api.useFeatureFlag("banner"),
      }),
      null
    );
    await vi.waitFor(() => expect(mounted.value.ready.value).toBe(true));
    expect(mounted.value.test.variant.value).toBe("a");
    expect(mounted.value.flag.value).toBe(false);
  });

  it("reacts to variants, flags and typed remote configuration", async () => {
    const api = make();
    const mounted = mount(api, () => ({
      test: api.useAbby("heading"),
      flag: api.useFeatureFlag("banner"),
      title: api.useRemoteConfig("title"),
      limit: api.useRemoteConfig("limit"),
      options: api.useRemoteConfig("options"),
      client: api.useAbbyClient(),
    }));
    await nextTick();
    expect(mounted.value.test.variant.value).toBe("a");
    expect(mounted.value.flag.value).toBe(true);
    expect(mounted.value.limit.value).toBe(7);
    expect(mounted.value.options.value).toEqual({ enabled: true });
    mounted.value.client.init({
      ...data(),
      tests: [
        { name: "heading", weights: [0, 1] },
        { name: "button", weights: [0, 1] },
      ],
    });
    mounted.value.client.updateFlag("banner", false);
    mounted.value.client.updateRemoteConfig("title", "Updated");
    await nextTick();
    expect(mounted.value.test.variant.value).toBe("b");
    expect(mounted.value.flag.value).toBe(false);
    expect(mounted.value.title.value).toBe("Updated");
  });

  it("tracks current names and raw variants, not lookup values", async () => {
    const send = vi
      .spyOn(HttpService, "sendData")
      .mockImplementation(() => undefined);
    const api = make();
    const name = ref<"heading" | "button">("heading");
    const mounted = mount(api, () =>
      api.useAbby(name, { a: "Alpha", b: "Beta" })
    );
    await nextTick();
    expect(mounted.value.variant.value).toBe("Alpha");
    mounted.value.onAct();
    expect(send).toHaveBeenLastCalledWith(
      expect.objectContaining({
        type: AbbyEventType.ACT,
        data: expect.objectContaining({
          testName: "heading",
          selectedVariant: "a",
        }),
      })
    );
    name.value = "button";
    await nextTick();
    expect(mounted.value.variant.value).toBe("Beta");
    mounted.value.onAct();
    expect(send).toHaveBeenLastCalledWith(
      expect.objectContaining({
        type: AbbyEventType.ACT,
        data: expect.objectContaining({
          testName: "button",
          selectedVariant: "b",
        }),
      })
    );
    expect(
      send.mock.calls.some(([event]) => event.type === AbbyEventType.PING)
    ).toBe(true);
  });

  it("unsubscribes exactly once when its provider is unmounted", () => {
    const unsubscribe = vi.fn();
    const subscribe = vi
      .spyOn(Abby.prototype, "subscribe")
      .mockReturnValue(unsubscribe);
    const api = make();
    const mounted = mount(api, () => api.useFeatureFlag("banner"));
    expect(subscribe).toHaveBeenCalledTimes(1);
    mounted.unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    cleanup.pop();
  });

  it("isolates clients and mutable config between providers", async () => {
    const api = make();
    const first = mount(api, () => ({
      client: api.useAbbyClient(),
      flag: api.useFeatureFlag("banner"),
    }));
    const second = mount(api, () => ({
      client: api.useAbbyClient(),
      flag: api.useFeatureFlag("banner"),
    }));
    first.value.client.updateFlag("banner", false);
    await nextTick();
    expect(first.value.flag.value).toBe(false);
    expect(second.value.flag.value).toBe(true);
    expect(first.value.client).not.toBe(second.value.client);
    expect(first.value.client.getConfig().tests).not.toBe(
      second.value.client.getConfig().tests
    );
  });

  it("loads data once without initial data", async () => {
    const fetchData = vi
      .spyOn(HttpService, "getProjectData")
      .mockResolvedValue(data());
    const api = make();
    const mounted = mount(
      api,
      () => ({ ready: api.useAbbyStatus(), test: api.useAbby("heading") }),
      null
    );
    await vi.waitFor(() => expect(mounted.value.ready.value).toBe(true));
    expect(fetchData).toHaveBeenCalledTimes(1);
  });

  it("honors consent and project-scoped persisted variants", async () => {
    document.cookie = `${getABStorageKey("vue-tests", "heading")}=b;path=/`;
    const api = make();
    const mounted = mount(api, () => api.useAbby("heading"));
    await nextTick();
    expect(mounted.value.variant.value).toBe("b");
    expect(document.cookie).not.toContain(
      `${getABStorageKey("vue-tests", "button")}=`
    );
  });

  it("rejects use outside the matching provider", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => make().useFeatureFlag("banner")).toThrow("AbbyProvider");
    warn.mockRestore();
  });
});
