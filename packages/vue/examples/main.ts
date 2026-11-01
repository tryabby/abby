import { createApp, defineComponent, h } from "vue";
import icon from "../../../apps/web/public/favicon.png?url";
import { createAbby } from "../src/index";

const api = createAbby({
  projectId: "vue-local-demo",
  currentEnvironment: "development",
  environments: ["development"],
  tests: { heading: { variants: ["a", "b"] } },
  flags: ["banner"],
  remoteConfig: { title: "String", limit: "Number" },
  cookies: { disableByDefault: true },
});
const initialData = {
  tests: [{ name: "heading", weights: [1, 0] }],
  flags: [{ name: "banner", value: true }],
  remoteConfig: [
    { name: "title", value: "Welcome" },
    { name: "limit", value: 7 },
  ],
};
const Demo = defineComponent({
  setup() {
    const { variant, onAct } = api.useAbby("heading", {
      a: "Alpha",
      b: "Beta",
    });
    const flag = api.useFeatureFlag("banner");
    const title = api.useRemoteConfig("title");
    const limit = api.useRemoteConfig("limit");
    const ready = api.useAbbyStatus();
    const client = api.useAbbyClient();
    return () => [
      h("header", [h("img", { src: icon, alt: "Abby" }), h("h1", "Abby Vue")]),
      h("section", [
        h("h2", "Heading variant"),
        h("output", { "data-testid": "variant" }, variant.value ?? ""),
        h(
          "fieldset",
          { "aria-label": "Heading variant" },
          ["a", "b"].map((value) =>
            h("label", [
              h("input", {
                type: "radio",
                name: "variant",
                value,
                checked: client.getTestVariant("heading") === value,
                onChange: () =>
                  client.updateLocalVariant("heading", value as "a" | "b"),
              }),
              ` ${value.toUpperCase()}`,
            ])
          )
        ),
        h("button", { onClick: onAct }, "ACT"),
      ]),
      h("section", [
        h("h2", "Feature flag"),
        h("label", [
          h("input", {
            type: "checkbox",
            checked: flag.value,
            "aria-label": "Banner",
            onChange: (event: Event) =>
              client.updateFlag(
                "banner",
                (event.target as HTMLInputElement).checked
              ),
          }),
          " Banner",
        ]),
        h(
          "output",
          { class: "flag", "data-testid": "flag" },
          flag.value ? "Enabled" : "Disabled"
        ),
      ]),
      h("section", [
        h("h2", "Remote configuration"),
        h("label", [
          "Title",
          h("input", {
            type: "text",
            value: title.value,
            "aria-label": "Title",
            onInput: (event: Event) =>
              client.updateRemoteConfig(
                "title",
                (event.target as HTMLInputElement).value
              ),
          }),
        ]),
        h("output", { "data-testid": "title" }, title.value),
        h("label", [
          "Limit",
          h("input", {
            type: "number",
            value: limit.value,
            "aria-label": "Limit",
            onInput: (event: Event) =>
              client.updateRemoteConfig(
                "limit",
                Number((event.target as HTMLInputElement).value)
              ),
          }),
        ]),
        h("output", { "data-testid": "limit" }, String(limit.value)),
      ]),
      h(
        "footer",
        { "data-testid": "ready" },
        ready.value ? "Ready" : "Loading"
      ),
    ];
  },
});
createApp({
  render: () =>
    h(api.AbbyProvider, { initialData }, { default: () => h(Demo) }),
}).mount("#app");
