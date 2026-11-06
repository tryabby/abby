import { renderToString } from "@vue/server-renderer";
import { createSSRApp, defineComponent, h } from "vue";
import { createAbby } from "../src";

it("renders hydrated flags and config but no server-selected variant", async () => {
  const sdk = createAbby({
    projectId: "ssr-test",
    environments: ["test"],
    currentEnvironment: "test",
    cookies: { disableByDefault: true },
    tests: { checkout: { variants: ["control", "streamlined"] } },
    flags: ["newNav"],
    remoteConfig: { headline: "String" },
  });
  const Consumer = defineComponent({
    setup() {
      return {
        ...sdk.useAbby("checkout"),
        flag: sdk.useFeatureFlag("newNav"),
        headline: sdk.useRemoteConfig("headline"),
      };
    },
    template: "<div>{{ variant }}|{{ flag }}|{{ headline }}</div>",
  });
  const app = createSSRApp({
    render: () =>
      h(
        sdk.AbbyProvider,
        {
          initialData: {
            tests: [{ name: "checkout", weights: [0, 1] }],
            flags: [{ name: "newNav", value: true }],
            remoteConfig: [{ name: "headline", value: "SSR" }],
          },
        },
        () => h(Consumer)
      ),
  });

  expect(await renderToString(app)).toContain("<div>|true|SSR</div>");
});
