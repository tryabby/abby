// @vitest-environment node
import { HttpService } from "@tryabby/core";
import { describe, expect, it, vi } from "vitest";
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { createAbby } from "../index";

describe("server rendering", () => {
  it("isolates requests, avoids browser storage/fetch and renders hydration-safe variants", async () => {
    const config = {
      projectId: "ssr",
      currentEnvironment: "production",
      environments: ["production"],
      tests: { heading: { variants: ["a", "b"] } },
      flags: ["banner"],
    };
    const api = createAbby(config);
    const fetch = vi.spyOn(HttpService, "getProjectData");
    const child = defineComponent({
      setup() {
        const { variant } = api.useAbby("heading");
        const flag = api.useFeatureFlag("banner");
        return () => h("p", [variant.value ?? "pending", String(flag.value)]);
      },
    });
    const render = (value: boolean) =>
      renderToString(
        createSSRApp({
          render: () =>
            h(
              api.AbbyProvider,
              {
                initialData: {
                  tests: [{ name: "heading", weights: [0, 1] }],
                  flags: [{ name: "banner", value }],
                  remoteConfig: [],
                },
              },
              { default: () => h(child) }
            ),
        })
      );
    expect(await render(true)).toContain("pendingtrue");
    expect(await render(false)).toContain("pendingfalse");
    expect(await render(true)).toContain("pendingtrue");
    expect(config.tests.heading).not.toHaveProperty("weights");
    expect(fetch).not.toHaveBeenCalled();
    fetch.mockRestore();
  });
});
