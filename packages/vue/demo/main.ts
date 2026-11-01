import { HttpService } from "@tryabby/core";
import { createApp, defineComponent, h, ref } from "vue";
import { createAbby } from "../src/index";
import { createInitialData } from "./fixtures";
import "./styles.css";

type CapturedEvent = {
  id: number;
  time: string;
  kind: string;
  test: string;
  variant: string;
};

const events = ref<CapturedEvent[]>([]);
const blockedLoads = ref(0);
let nextEvent = 1;

// Patch the SAME module imported by the SDK, before installing the plugin.
// This is demonstration instrumentation, never part of the production SDK.
HttpService.sendData = ({ type, data }) => {
  events.value = [
    {
      id: nextEvent++,
      time: new Date().toLocaleTimeString(),
      kind: type === 1 ? "ACT" : "PING",
      test: data.testName,
      variant: data.selectedVariant,
    },
    ...events.value,
  ].slice(0, 12);
  return undefined;
};

HttpService.getProjectData = async () => {
  blockedLoads.value += 1;
  throw new Error(
    "The local demo must use initialData; API loading is disabled."
  );
};

const sdk = createAbby({
  projectId: "synthetic-vue-playground",
  environments: ["demo"],
  currentEnvironment: "demo",
  flags: ["showDetails"],
  tests: { welcome: { variants: ["calm", "bright"] } },
  remoteConfig: {
    headline: "String",
    previewCount: "Number",
    appearance: "JSON",
  },
  cookies: { disableByDefault: true },
  fetch: async () => {
    blockedLoads.value += 1;
    throw new Error("Network requests are disabled in this demo.");
  },
});

function button(
  label: string,
  onClick: () => void,
  attributes: Record<string, unknown> = {}
) {
  return h("button", { type: "button", onClick, ...attributes }, label);
}

const ReactivePanel = defineComponent({
  name: "ReactivePlayground",
  setup() {
    const client = sdk.useAbbyClient();
    const showDetails = sdk.useFeatureFlag("showDetails");
    const headline = sdk.useRemoteConfig("headline");
    const previewCount = sdk.useRemoteConfig("previewCount");
    const appearance = sdk.useRemoteConfig("appearance");
    const { variant, onAct } = sdk.useAbby("welcome");

    const switchVariant = () => {
      // updateLocalVariant is a development override in Abby core. Changing
      // synthetic weights also works in a production demo build, without cookies.
      client.init(
        createInitialData(variant.value === "calm" ? "bright" : "calm")
      );
    };

    return () =>
      h("div", { class: "playground", "data-testid": "reactive-panel" }, [
        h(
          "section",
          {
            class: [
              "preview",
              `preview--${appearance.value.tone === "mint" ? "mint" : "peach"}`,
            ],
          },
          [
            h("div", { class: "preview-topline" }, [
              h("span", { class: "eyebrow" }, "YOUR APPLICATION"),
              h(
                "span",
                { class: "variant-tag", "data-testid": "variant-value" },
                variant.value ?? "Waiting for mount"
              ),
            ]),
            h("div", { class: "preview-art", "aria-hidden": "true" }, [
              h("span", { class: "shape shape-one" }),
              h("span", { class: "shape shape-two" }),
              h("span", { class: "shape shape-three" }),
            ]),
            h("p", { class: "eyebrow" }, "MADE TO REACT"),
            h("h2", { "data-testid": "headline-value" }, headline.value),
            showDetails.value
              ? h(
                  "p",
                  {
                    class: "preview-description",
                    "data-testid": "flag-content",
                  },
                  "This detail is controlled by a feature flag. Change the controls and watch this view update without a reload."
                )
              : h(
                  "p",
                  {
                    class: "preview-description muted",
                    "data-testid": "flag-hidden",
                  },
                  "Details are hidden by the feature flag."
                ),
            h(
              "div",
              {
                class: "sample-row",
                "data-testid": "number-preview",
                "aria-label": `${previewCount.value} preview items`,
              },
              Array.from(
                { length: Math.max(0, Math.min(6, previewCount.value)) },
                (_, index) =>
                  h(
                    "span",
                    {
                      class: [
                        "sample-item",
                        appearance.value.rounded ? "sample-item--round" : "",
                      ],
                    },
                    String(index + 1)
                  )
              )
            ),
            button("Try this experience", onAct, {
              class: "primary",
              "data-testid": "track-act",
            }),
            h(
              "p",
              { class: "preview-footnote" },
              "This action records a local ACT event. Nothing is sent."
            ),
          ]
        ),
        h(
          "section",
          { class: "controls", "aria-labelledby": "controls-title" },
          [
            h("div", { class: "section-heading" }, [
              h("span", { class: "eyebrow" }, "LIVE CONTROLS"),
              h(
                "h2",
                { id: "controls-title" },
                "Small inputs. Real reactivity."
              ),
            ]),
            h("div", { class: "control-row" }, [
              h("div", [
                h("h3", "Feature flag"),
                h("code", "showDetails"),
                h(
                  "output",
                  { "data-testid": "flag-value" },
                  String(showDetails.value)
                ),
              ]),
              button(
                showDetails.value ? "Turn off" : "Turn on",
                () => client.updateFlag("showDetails", !showDetails.value),
                {
                  "data-testid": "toggle-flag",
                  "aria-pressed": showDetails.value,
                }
              ),
            ]),
            h("div", { class: "control-row" }, [
              h("div", [
                h("h3", "String configuration"),
                h("code", "headline"),
              ]),
              button(
                "Change text",
                () =>
                  client.updateRemoteConfig(
                    "headline",
                    headline.value.startsWith("A little")
                      ? "Vue keeps every detail in sync."
                      : "A little change. A live result."
                  ),
                { "data-testid": "change-string" }
              ),
            ]),
            h("div", { class: "control-row" }, [
              h("div", [
                h("h3", "Number configuration"),
                h("code", "previewCount"),
                h(
                  "output",
                  { "data-testid": "number-value" },
                  String(previewCount.value)
                ),
              ]),
              button(
                "Next count",
                () =>
                  client.updateRemoteConfig(
                    "previewCount",
                    previewCount.value >= 6 ? 1 : previewCount.value + 1
                  ),
                { "data-testid": "change-number" }
              ),
            ]),
            h("div", { class: "control-row" }, [
              h("div", [
                h("h3", "JSON configuration"),
                h(
                  "code",
                  { "data-testid": "json-value" },
                  JSON.stringify(appearance.value)
                ),
              ]),
              button(
                "Change style",
                () =>
                  client.updateRemoteConfig("appearance", {
                    tone: appearance.value.tone === "mint" ? "peach" : "mint",
                    rounded: !appearance.value.rounded,
                  }),
                { "data-testid": "change-json" }
              ),
            ]),
            h("div", { class: "control-row" }, [
              h("div", [
                h("h3", "A/B test"),
                h("code", "welcome"),
                h(
                  "output",
                  { "data-testid": "test-value" },
                  variant.value ?? "Not mounted"
                ),
              ]),
              button("Switch variant", switchVariant, {
                "data-testid": "change-variant",
              }),
            ]),
            h(
              "p",
              { class: "controls-note" },
              "The A/B control replaces synthetic weights with 100% calm or bright. It does not change a live project."
            ),
          ]
        ),
      ]);
  },
});

const App = defineComponent({
  name: "AbbyVueDemo",
  setup() {
    const panelVisible = ref(true);
    return () =>
      h("main", { class: "shell" }, [
        h("header", { class: "masthead" }, [
          h(
            "a",
            {
              href: "#app",
              class: "wordmark",
              "aria-label": "Abby Vue local playground",
            },
            ["abby", h("span", "+ vue")]
          ),
          h("span", { class: "status-pill" }, [
            h("span", { class: "status-dot", "aria-hidden": "true" }),
            "LOCAL DATA ONLY",
          ]),
        ]),
        h("section", { class: "intro" }, [
          h("p", { class: "eyebrow" }, "A FRAMEWORK-NATIVE INTEGRATION"),
          h("h1", [
            "Configuration changes.",
            h("br"),
            h("span", "Your interface follows."),
          ]),
          h(
            "p",
            { class: "intro-description" },
            "Feature flags, typed remote configuration, and A/B tests — connected to Vue computed refs. Explore a working application with synthetic data."
          ),
          h("div", { class: "intro-meta" }, [
            h("span", "Vue 3.5+"),
            h("span", "No account or API key"),
            h("span", "No outbound API / telemetry"),
          ]),
        ]),
        h("div", { class: "workspace-toolbar" }, [
          h(
            "p",
            "An actual Vue application. Every control updates the rendered DOM."
          ),
          button(
            panelVisible.value ? "Unmount panel" : "Mount panel",
            () => {
              panelVisible.value = !panelVisible.value;
            },
            {
              "data-testid": "toggle-panel",
              "aria-pressed": panelVisible.value,
            }
          ),
        ]),
        panelVisible.value
          ? h(ReactivePanel)
          : h(
              "section",
              { class: "empty-state", "data-testid": "panel-unmounted" },
              [
                h("h2", "Panel unmounted."),
                h(
                  "p",
                  "Mount it again to exercise composable lifecycle cleanup and a fresh component subscription."
                ),
              ]
            ),
        h(
          "section",
          { class: "event-section", "aria-labelledby": "events-title" },
          [
            h("div", { class: "event-heading" }, [
              h("div", [
                h("p", { class: "eyebrow" }, "OBSERVABLE, NOT UPLOADED"),
                h("h2", { id: "events-title" }, "Local event inspector"),
              ]),
              button(
                "Clear log",
                () => {
                  events.value = [];
                },
                {
                  "data-testid": "clear-events",
                  disabled: events.value.length === 0,
                }
              ),
            ]),
            h(
              "p",
              { class: "event-explanation" },
              "The demo intercepts HttpService.sendData before SDK installation. PING and ACT events stay in memory and disappear on reload."
            ),
            h(
              "div",
              {
                class: "event-list",
                "data-testid": "event-log",
                "aria-live": "polite",
                "aria-relevant": "additions text",
              },
              events.value.length
                ? events.value.map((event) =>
                    h("div", { class: "event-row", key: event.id }, [
                      h(
                        "span",
                        {
                          class: [
                            "event-kind",
                            `event-kind--${event.kind.toLowerCase()}`,
                          ],
                        },
                        event.kind
                      ),
                      h("code", `${event.test} → ${event.variant}`),
                      h("time", event.time),
                      h("span", { class: "event-local" }, "captured locally"),
                    ])
                  )
                : [
                    h(
                      "p",
                      { class: "empty-log" },
                      "No local events yet. Mount the panel or try the experience."
                    ),
                  ]
            ),
            h(
              "p",
              { class: "guard-status", "data-testid": "network-guard" },
              `Project-data load attempts: ${blockedLoads.value}. All API loading and telemetry transport are disabled.`
            ),
          ]
        ),
        h("footer", [
          h(
            "p",
            "Original Vue integration demo · Synthetic configuration · No production project connected"
          ),
          h(
            "p",
            "Local HTTP serves app assets; the page CSP blocks fetch, WebSocket, and beacon connections."
          ),
          h("p", [
            h(
              "a",
              {
                href: "https://github.com/CarsonCCHsieh/abby/tree/feat/vue-integration",
                target: "_blank",
                rel: "noopener noreferrer",
              },
              "Corresponding source"
            ),
            " · ",
            h("a", { href: "./walkthrough.mp4" }, "26-second walkthrough"),
            " · ",
            h("a", { href: "./LICENSE.txt" }, "AGPL-3.0 license"),
            " · ",
            h(
              "a",
              { href: "./THIRD_PARTY_NOTICES.txt" },
              "Third-party notices"
            ),
          ]),
        ]),
      ]);
  },
});

createApp(App)
  .use(sdk.AbbyPlugin, { initialData: createInitialData() })
  .mount("#app");
