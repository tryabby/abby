// @vitest-environment node
import { HttpService } from "@tryabby/core";
import { renderToString } from "@vue/server-renderer";
import { createSSRApp, h } from "vue";
import { createSdk, projectData } from "./fixtures";

it("renders initial flags/config on the server without assigning or tracking a variant", async () => {
  const sdk = createSdk();
  const load = vi.spyOn(HttpService, "getProjectData");
  const send = vi.spyOn(HttpService, "sendData");
  const app = createSSRApp({
    setup() {
      const flag = sdk.useFeatureFlag("new-ui");
      const greeting = sdk.useRemoteConfig("greeting");
      const test = sdk.useAbby("headline");
      test.onAct();
      return () =>
        h(
          "output",
          `${flag.value}|${greeting.value}|${test.variant.value ?? "pending"}`
        );
    },
  });
  app.use(sdk, { initialData: projectData(true) });
  expect(await renderToString(app)).toBe("<output>true|Hello|pending</output>");
  expect(load).not.toHaveBeenCalled();
  expect(send).not.toHaveBeenCalled();
});

it("keeps simultaneous SSR requests independent when they share one SDK factory", async () => {
  const sdk = createSdk();
  const Root = {
    setup() {
      const flag = sdk.useFeatureFlag("new-ui");
      return () => h("output", String(flag.value));
    },
  };
  const left = createSSRApp(Root);
  const right = createSSRApp(Root);
  left.use(sdk, { initialData: projectData(false) });
  right.use(sdk, { initialData: projectData(true) });
  expect(
    await Promise.all([renderToString(left), renderToString(right)])
  ).toEqual(["<output>false</output>", "<output>true</output>"]);
});
