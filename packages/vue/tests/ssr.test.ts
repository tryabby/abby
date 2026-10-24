import { HttpService, getABStorageKey } from "@tryabby/core";
// @vitest-environment node
import { renderToString } from "@vue/server-renderer";
import { expect, it, vi } from "vitest";
import { createSSRApp, defineComponent, h } from "vue";
import { data, makeAbby } from "./fixtures";

it("isolates concurrent SSR requests, input config and request cookies", async () => {
  const first = makeAbby();
  const second = makeAbby();
  const send = vi.spyOn(HttpService, "sendData");
  function app(
    sdk: ReturnType<typeof makeAbby>,
    enabled: boolean,
    variant: string
  ) {
    const Child = defineComponent({
      setup() {
        const flag = sdk.useFeatureFlag("premium");
        const test = sdk.useAbby("button");
        return () =>
          h("div", `${flag.value}|${test.variant.value ?? "pending"}`);
      },
    });
    return createSSRApp({
      render: () =>
        h(
          sdk.AbbyProvider,
          {
            initialData: {
              ...data,
              flags: [{ name: "premium", value: enabled }],
            },
            cookies: `${getABStorageKey("vue-test", "button")}=${variant}`,
          },
          { default: () => h(Child) }
        ),
    });
  }
  const result = await Promise.all([
    renderToString(app(first, true, "control")),
    renderToString(app(second, false, "blue")),
  ]);
  expect(result[0]).toContain("true|pending");
  expect(result[1]).toContain("false|pending");
  expect(first.getABTestValue("button")).toBe("control");
  expect(second.getABTestValue("button")).toBe("blue");
  first.disableCookies();
  expect(second.__abby__.getConfig().cookies?.disableByDefault).not.toBe(true);
  expect(send).not.toHaveBeenCalled();
});

it("rejects accidental reuse across SSR applications instead of leaking user state", async () => {
  const sdk = makeAbby();
  const app = () =>
    createSSRApp({ render: () => h(sdk.AbbyProvider, { initialData: data }) });
  await renderToString(app());
  await expect(renderToString(app())).rejects.toThrow("fresh Abby instance");
});
