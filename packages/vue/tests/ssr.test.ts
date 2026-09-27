// @vitest-environment node
import { type AbbyDataResponse, HttpService } from "@tryabby/core";
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { createAbby } from "../src";

const config = {
  projectId: "ssr",
  currentEnvironment: "test",
  environments: ["test"],
  tests: { checkout: { variants: ["old", "new"] } },
  flags: ["banner"],
  remoteConfig: { title: "String" as const },
};
afterEach(() => {
  vi.restoreAllMocks();
});

it("renders initial flags and config without browser APIs, subscriptions or tracking", async () => {
  const abby = createAbby(config);
  const subscribe = vi.spyOn(abby.__abby__, "subscribe");
  const load = vi.spyOn(abby.__abby__, "loadProjectData");
  const send = vi.spyOn(HttpService, "sendData");
  const child = defineComponent({
    setup() {
      const flag = abby.useFeatureFlag("banner");
      const title = abby.useRemoteConfig("title");
      const test = abby.useAbby("checkout");
      test.onAct();
      return () =>
        h(
          "div",
          `${flag.value}|${title.value}|${test.variant.value ?? "pending"}`
        );
    },
  });
  const initialData: AbbyDataResponse = {
    flags: [{ name: "banner", value: true }],
    tests: [{ name: "checkout", weights: [0, 1] }],
    remoteConfig: [{ name: "title", value: "Server title" }],
  };
  const html = await renderToString(
    createSSRApp({
      render: () => h(abby.AbbyProvider, { initialData }, () => h(child)),
    })
  );
  expect(html).toContain("true|Server title|pending");
  expect(subscribe).not.toHaveBeenCalled();
  expect(load).not.toHaveBeenCalled();
  expect(send).not.toHaveBeenCalled();
});

it("isolates simultaneous requests even when they reuse a configuration object", async () => {
  async function render(title: string) {
    const abby = createAbby(config);
    const child = defineComponent({
      async setup() {
        const value = abby.useRemoteConfig("title");
        await Promise.resolve();
        return () => h("p", value.value);
      },
    });
    const initialData: AbbyDataResponse = {
      tests: [{ name: "checkout", weights: title === "A" ? [0, 1] : [1, 0] }],
      flags: [],
      remoteConfig: [{ name: "title", value: title }],
    };
    return renderToString(
      createSSRApp({
        render: () => h(abby.AbbyProvider, { initialData }, () => h(child)),
      })
    );
  }
  const [first, second] = await Promise.all([render("A"), render("B")]);
  expect(first).toContain("<p>A</p>");
  expect(second).toContain("<p>B</p>");
  expect(config.tests.checkout).not.toHaveProperty("weights");
  expect(config.tests.checkout).not.toHaveProperty("selectedVariant");
});
