// @vitest-environment node

import { HttpService } from "@tryabby/core";
import { renderToString } from "@vue/server-renderer";
import { createSSRApp, defineComponent, h } from "vue";
import { createAbby } from "../src";
import { initialData } from "./utils";

const createTestAbby = () =>
  createAbby({
    projectId: "123",
    environments: [""],
    currentEnvironment: "",
    tests: { test: { variants: ["A", "B", "C"] } },
    flags: ["flag1", "flag2"],
    remoteConfig: { text: "String" },
  });

describe("server side rendering", () => {
  it("renders flags and remote config but no variant", async () => {
    const { AbbyPlugin, useAbby, useFeatureFlag, useRemoteConfig } =
      createTestAbby();

    const app = createSSRApp(
      defineComponent({
        setup() {
          const { variant } = useAbby("test");
          const flag1 = useFeatureFlag("flag1");
          const text = useRemoteConfig("text");
          return () =>
            h("div", [
              h("span", { id: "variant" }, variant.value),
              h("span", { id: "flag" }, String(flag1.value)),
              h("span", { id: "text" }, text.value),
            ]);
        },
      })
    ).use(AbbyPlugin, { initialData });

    const html = await renderToString(app);

    // the server doesn't know the user's variant, it's selected after hydration
    expect(html).toContain('<span id="variant"></span>');
    expect(html).toContain('<span id="flag">true</span>');
    expect(html).toContain('<span id="text">Hello</span>');
  });

  it("doesn't subscribe, load data or send events on the server", async () => {
    const { AbbyPlugin, useAbby, __abby__ } = createTestAbby();
    const subscribeSpy = vi.spyOn(__abby__, "subscribe");
    const loadSpy = vi.spyOn(__abby__, "loadProjectData");
    const sendSpy = vi.spyOn(HttpService, "sendData");

    for (const options of [{ initialData }, undefined]) {
      const app = createSSRApp(
        defineComponent({
          setup() {
            const { variant } = useAbby("test");
            return () => h("p", variant.value);
          },
        })
      ).use(AbbyPlugin, options);

      await renderToString(app);
    }

    expect(subscribeSpy).not.toHaveBeenCalled();
    expect(loadSpy).not.toHaveBeenCalled();
    expect(sendSpy).not.toHaveBeenCalled();
  });
});
