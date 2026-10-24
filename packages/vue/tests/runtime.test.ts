import {
  type AbbyDataResponse,
  AbbyEventType,
  HttpService,
  getABStorageKey,
} from "@tryabby/core";
import { renderToString } from "@vue/server-renderer";
import { type VueWrapper, flushPromises, mount } from "@vue/test-utils";
import Cookie from "js-cookie";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSSRApp, defineComponent, h, nextTick, ref } from "vue";
import { createAbby } from "../src";
import { config, data, makeAbby } from "./fixtures";

const wrappers: VueWrapper[] = [];
beforeEach(() => {
  // All HTTP is deterministic and local to the test, including core telemetry.
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("{}", { status: 200 }))
  );
});
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  for (const key of Object.keys(Cookie.get())) Cookie.remove(key);
  vi.unstubAllGlobals();
});

function render(
  sdk: ReturnType<typeof makeAbby>,
  setup: () => () => ReturnType<typeof h>,
  initialData: AbbyDataResponse | null = data
) {
  const Child = defineComponent({ setup });
  const wrapper = mount(sdk.AbbyProvider, {
    props: { initialData: initialData ?? undefined },
    slots: { default: () => h(Child) },
  });
  wrappers.push(wrapper);
  return wrapper;
}

describe("Vue integration with real core", () => {
  it("does not overwrite newer provider data with a late initial fetch", async () => {
    let resolveFetch: (response: Response) => void = () => {};
    const sdk = createAbby({
      ...config,
      environments: [...config.environments],
      flags: [...config.flags],
      fetch: () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    });
    const wrapper = render(
      sdk,
      () => {
        const title = sdk.useRemoteConfig("title");
        return () => h("div", title.value);
      },
      null
    );
    await wrapper.setProps({
      initialData: {
        ...data,
        remoteConfig: [{ name: "title", value: "New provider data" }],
      },
    });
    resolveFetch(new Response(JSON.stringify(data), { status: 200 }));
    await flushPromises();
    expect(wrapper.text()).toBe("New provider data");
  });

  it("does not emit events or recreate subscriptions when a fetch completes after unmount", async () => {
    let resolveFetch: (response: Response) => void = () => {};
    const sdk = createAbby({
      ...config,
      environments: [...config.environments],
      flags: [...config.flags],
      fetch: () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    });
    const send = vi
      .spyOn(HttpService, "sendData")
      .mockImplementation(() => undefined);
    const wrapper = render(
      sdk,
      () => {
        const { variant } = sdk.useAbby("button");
        return () => h("div", variant.value);
      },
      null
    );
    wrapper.unmount();
    resolveFetch(new Response(JSON.stringify(data), { status: 200 }));
    await flushPromises();
    expect(send).not.toHaveBeenCalled();
    expect(
      Cookie.get(getABStorageKey(config.projectId, "button"))
    ).toBeUndefined();
  });

  it("sends real core PING/ACT payloads for reactive test names without duplicate views", async () => {
    const sdk = makeAbby();
    const name = ref<"button" | "other">("button");
    let act = () => {};
    render(sdk, () => {
      const result = sdk.useAbby(name);
      act = result.onAct;
      return () => h("div", result.variant.value);
    });
    await flushPromises();
    const fetcher = vi.mocked(globalThis.fetch);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(fetcher.mock.calls[0][1]?.body))).toEqual({
      type: 0,
      projectId: "vue-test",
      testName: "button",
      selectedVariant: "blue",
    });
    sdk.__abby__.updateFlag("premium", false);
    await nextTick();
    expect(fetcher).toHaveBeenCalledTimes(1);
    name.value = "other";
    await nextTick();
    act();
    expect(JSON.parse(String(fetcher.mock.calls.at(-1)?.[1]?.body))).toEqual({
      type: 1,
      projectId: "vue-test",
      testName: "other",
      selectedVariant: "one",
    });
  });
  it("renders weighted variants, flags, remote configs and typed lookups reactively", async () => {
    const sdk = makeAbby();
    const send = vi
      .spyOn(HttpService, "sendData")
      .mockImplementation(() => undefined);
    let act = () => {};
    const wrapper = render(sdk, () => {
      const { variant, onAct } = sdk.useAbby("button", {
        control: "Original",
        blue: "Blue button",
      });
      act = onAct;
      const flag = sdk.useFeatureFlag("premium");
      const title = sdk.useRemoteConfig("title");
      const all = sdk.useFeatureFlags();
      const configs = sdk.useRemoteConfigVariables();
      return () =>
        h(
          "div",
          `${variant.value}|${flag.value}|${title.value}|${all.value.length}|${configs.value.length}`
        );
    });
    await flushPromises();
    expect(wrapper.text()).toBe("Blue button|true|Hello Vue|2|3");
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AbbyEventType.PING,
        data: {
          projectId: "vue-test",
          testName: "button",
          selectedVariant: "blue",
        },
      })
    );
    act();
    expect(send).toHaveBeenLastCalledWith(
      expect.objectContaining({
        type: AbbyEventType.ACT,
        data: expect.objectContaining({ selectedVariant: "blue" }),
      })
    );
    sdk.__abby__.updateFlag("premium", false);
    sdk.__abby__.updateRemoteConfig("title", "Updated");
    sdk.__abby__.updateLocalVariant("button", "control");
    await nextTick();
    expect(wrapper.text()).toBe("Original|false|Updated|2|3");
    act();
    expect(send).toHaveBeenLastCalledWith(
      expect.objectContaining({
        type: AbbyEventType.ACT,
        data: expect.objectContaining({ selectedVariant: "control" }),
      })
    );
  });

  it("fetches centrally once and supports reactive names", async () => {
    const fetcher = vi.fn<typeof fetch>(
      async () => new Response(JSON.stringify(data), { status: 200 })
    );
    const sdk = createAbby({
      ...config,
      environments: [...config.environments],
      flags: [...config.flags],
      fetch: fetcher,
    });
    const name = ref<"premium" | "search">("premium");
    const wrapper = render(
      sdk,
      () => {
        const first = sdk.useFeatureFlag(name);
        const second = sdk.useRemoteConfig("count");
        return () => h("div", `${first.value}|${second.value}`);
      },
      null
    );
    await flushPromises();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toContain(
      "api/v2/data/vue-test?environment=test"
    );
    expect(wrapper.text()).toBe("true|7");
    name.value = "search";
    await nextTick();
    expect(wrapper.text()).toBe("false|7");
  });

  it("keeps configured defaults on a failed or partial API response", async () => {
    const sdk = createAbby({
      ...config,
      environments: [...config.environments],
      flags: [...config.flags],
      settings: {
        flags: { defaultValue: true },
        remoteConfig: {
          fallbackValues: { title: "Fallback" },
          defaultValues: { Number: 42 },
        },
      },
      fetch: async () => new Response("", { status: 503 }),
    });
    const wrapper = render(
      sdk,
      () => {
        const flag = sdk.useFeatureFlag("search");
        const title = sdk.useRemoteConfig("title");
        const count = sdk.useRemoteConfig("count");
        return () => h("div", `${flag.value}|${title.value}|${count.value}`);
      },
      null
    );
    await flushPromises();
    expect(wrapper.text()).toBe("true|Fallback|42");
    await wrapper.setProps({
      initialData: { tests: [], flags: [], remoteConfig: [] },
    });
    expect(wrapper.text()).toBe("true|Fallback|42");
  });

  it("persists valid variants with configured expiry, ignores stale assignments and resets", async () => {
    Cookie.set(getABStorageKey(config.projectId, "button"), "obsolete");
    const set = vi.spyOn(Cookie, "set");
    const sdk = createAbby({
      ...config,
      environments: [...config.environments],
      flags: [...config.flags],
      cookies: { expiresInDays: 3 },
    });
    render(sdk, () => {
      const { variant } = sdk.useAbby("button");
      return () => h("div", variant.value);
    });
    await flushPromises();
    expect(sdk.getABTestValue("button")).toBe("blue");
    expect(Cookie.get(getABStorageKey(config.projectId, "button"))).toBe(
      "blue"
    );
    expect(set).toHaveBeenCalledWith(
      getABStorageKey(config.projectId, "button"),
      "blue",
      { expires: 3 }
    );
    sdk.getABResetFunction("button")();
    expect(
      Cookie.get(getABStorageKey(config.projectId, "button"))
    ).toBeUndefined();
  });

  it("does not write assignment cookies without consent and can enable/revoke consent", async () => {
    const sdk = createAbby({
      ...config,
      environments: [...config.environments],
      flags: [...config.flags],
      cookies: { disableByDefault: true },
    });
    render(sdk, () => {
      const { variant } = sdk.useAbby("button");
      return () => h("div", variant.value);
    });
    await flushPromises();
    expect(
      Cookie.get(getABStorageKey(config.projectId, "button"))
    ).toBeUndefined();
    sdk.enableCookies();
    expect(Cookie.get(getABStorageKey(config.projectId, "button"))).toBe(
      "blue"
    );
    sdk.disableCookies();
    expect(
      Cookie.get(getABStorageKey(config.projectId, "button"))
    ).toBeUndefined();
    expect(Cookie.get(getABStorageKey(config.projectId, "$_abcc_$"))).toBe(
      "false"
    );
  });

  it("updates targeting rules and rejects invalid user properties", async () => {
    const sdk = makeAbby();
    const initialData: AbbyDataResponse = {
      ...data,
      flags: [
        {
          name: "premium",
          value: false,
          ruleSet: [
            {
              propertyName: "role",
              propertyType: "string",
              operator: "eq",
              value: "admin",
              thenValue: true,
            },
          ],
        },
      ],
    };
    const wrapper = render(
      sdk,
      () => {
        const flag = sdk.useFeatureFlag("premium");
        return () => h("div", String(flag.value));
      },
      initialData
    );
    sdk.updateUserProperties({ role: "admin" });
    await nextTick();
    expect(wrapper.text()).toBe("true");
    expect(() => sdk.updateUserProperties({ role: 1 } as never)).toThrow();
    expect(wrapper.text()).toBe("true");
  });

  it("requires the matching provider and rejects unknown runtime names", () => {
    const sdk = makeAbby();
    expect(() => sdk.useFeatureFlag("premium")).toThrow("AbbyProvider");
    expect(() => sdk.getFeatureFlagValue("unknown" as never)).toThrow(
      "Unknown Abby feature flag"
    );
    expect(() => sdk.getRemoteConfig("unknown" as never)).toThrow(
      "Unknown Abby remote config"
    );
    expect(() => sdk.getABTestValue("unknown" as never)).toThrow(
      "Unknown Abby test"
    );
    const other = makeAbby();
    expect(() =>
      render(sdk, () => {
        other.useFeatureFlag("premium");
        return () => h("div");
      })
    ).toThrow("AbbyProvider");
  });

  it("unsubscribes and stops events after unmount", async () => {
    const sdk = makeAbby();
    const unsubscribe = vi.fn();
    const subscribe = sdk.__abby__.subscribe.bind(sdk.__abby__);
    vi.spyOn(sdk.__abby__, "subscribe").mockImplementation((callback) => {
      const stop = subscribe(callback);
      return () => {
        stop();
        unsubscribe();
      };
    });
    const send = vi
      .spyOn(HttpService, "sendData")
      .mockImplementation(() => undefined);
    let act = () => {};
    const wrapper = render(sdk, () => {
      const result = sdk.useAbby("button");
      act = result.onAct;
      return () => h("div", result.variant.value);
    });
    await flushPromises();
    wrapper.unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    send.mockClear();
    sdk.__abby__.updateFlag("premium", false);
    act();
    await nextTick();
    expect(send).not.toHaveBeenCalled();
  });

  it("mounts devtools only when requested and destroys them on unmount", () => {
    const sdk = makeAbby();
    const destroy = vi.fn();
    const factory = {
      create: vi.fn(
        (_props: { abby: typeof sdk.__abby__; defaultShow?: boolean }) =>
          destroy
      ),
    };
    const Disabled = sdk.withDevtools(factory, {});
    const disabled = mount(Disabled);
    disabled.unmount();
    expect(factory.create).not.toHaveBeenCalled();
    const Enabled = sdk.withDevtools(factory, {
      dangerouslyForceShow: true,
      defaultShow: true,
    });
    const wrapper = mount(Enabled);
    expect(factory.create).toHaveBeenCalledWith({
      abby: sdk.__abby__,
      defaultShow: true,
    });
    wrapper.unmount();
    expect(destroy).toHaveBeenCalledTimes(1);
  });

  it("hydrates initial flags/config without mismatch and selects variants after mount", async () => {
    function app() {
      const sdk = makeAbby();
      const Child = defineComponent({
        setup() {
          const flag = sdk.useFeatureFlag("premium");
          const { variant } = sdk.useAbby("button");
          return () => h("div", `${flag.value}|${variant.value ?? "pending"}`);
        },
      });
      return createSSRApp({
        render: () =>
          h(
            sdk.AbbyProvider,
            { initialData: data },
            { default: () => h(Child) }
          ),
      });
    }
    const html = await renderToString(app());
    expect(html).toContain("true|pending");
    const target = document.createElement("div");
    target.innerHTML = html;
    document.body.append(target);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const client = app();
    client.mount(target);
    await flushPromises();
    expect(target.textContent).toBe("true|blue");
    expect(warn).not.toHaveBeenCalled();
    client.unmount();
    target.remove();
  });
});
