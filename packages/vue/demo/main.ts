import type { AbbyDataResponse } from "@tryabby/core";
import { createAbby } from "@tryabby/vue";
import {
  createApp,
  defineComponent,
  h,
  onMounted,
  onUnmounted,
  ref,
} from "vue";
import "./style.css";

const fixture: AbbyDataResponse = {
  tests: [{ name: "checkout", weights: [1, 0] }],
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
  remoteConfig: [
    { name: "headline", value: "A small change. A clear result." },
  ],
};
const sdk = createAbby({
  projectId: "vue-local-demo",
  currentEnvironment: "demo",
  environments: ["demo"],
  apiUrl: "/",
  tests: { checkout: { variants: ["original", "fresh"] } },
  flags: ["premium"],
  remoteConfig: { headline: "String" },
  user: { role: { type: "string" } },
});
const Demo = defineComponent({
  setup() {
    const { variant, onAct } = sdk.useAbby("checkout");
    const premium = sdk.useFeatureFlag("premium");
    const headline = sdk.useRemoteConfig("headline");
    const views = ref(0);
    const acts = ref(0);
    const targeting = ref("visitor");
    const consent = ref(!sdk.__abby__.getConfig().cookies?.disableByDefault);
    let timer: ReturnType<typeof setInterval>;
    onMounted(() => {
      const read = async () => {
        const events = (await fetch("/events").then((response) =>
          response.json()
        )) as { type: number }[];
        views.value = events.filter((event) => event.type === 0).length;
        acts.value = events.filter((event) => event.type === 1).length;
      };
      void read();
      timer = setInterval(() => {
        void read();
      }, 300);
    });
    onUnmounted(() => clearInterval(timer));
    const button = (text: string, action: () => void) =>
      h("button", { type: "button", onClick: action }, text);
    return () =>
      h("main", [
        h("p", { class: "eyebrow" }, "ABBY / VUE 3"),
        h("h1", "Vue integration, live."),
        h(
          "p",
          { class: "intro" },
          "A/B testing, feature flags and remote config — reacting together."
        ),
        h(
          "p",
          { class: "fixture" },
          "Local deterministic fixture · actual built SDK · no hosted Abby connection"
        ),
        h("section", { class: "preview", "aria-label": "Live preview" }, [
          h("div", { class: "topline" }, [
            h("span", "CHECKOUT PREVIEW"),
            h(
              "span",
              { class: "pill" },
              `Variant: ${variant.value ?? "pending"}`
            ),
          ]),
          h("h2", headline.value),
          h(
            "p",
            `Premium feature: ${premium.value ? "enabled" : "disabled"} · User role: ${targeting.value}`
          ),
          h(
            "button",
            { type: "button", class: `cta ${variant.value}`, onClick: onAct },
            "Record conversion"
          ),
        ]),
        h("section", { class: "controls", "aria-label": "SDK controls" }, [
          button("Switch variant", () =>
            sdk.__abby__.updateLocalVariant(
              "checkout",
              variant.value === "original" ? "fresh" : "original"
            )
          ),
          button("Toggle feature flag", () =>
            sdk.__abby__.updateFlag("premium", !premium.value)
          ),
          button("Change remote title", () =>
            sdk.__abby__.updateRemoteConfig(
              "headline",
              "Updated remotely. Rendered immediately."
            )
          ),
          button("Target admin user", () => {
            sdk.updateUserProperties({ role: "admin" });
            targeting.value = "admin";
          }),
          button(
            consent.value ? "Revoke cookie consent" : "Enable cookie consent",
            () => {
              consent.value = !consent.value;
              if (consent.value) sdk.enableCookies();
              else sdk.disableCookies();
            }
          ),
        ]),
        h("footer", [
          h("div", [
            h("strong", String(views.value)),
            h("span", "View events"),
          ]),
          h("div", [
            h("strong", String(acts.value)),
            h("span", "Conversion events"),
          ]),
          h("div", [
            h("strong", consent.value ? "On" : "Off"),
            h("span", "Assignment cookies"),
          ]),
          h("p", "Events shown here were received by this local demo server."),
        ]),
      ]);
  },
});
createApp({
  render: () =>
    h(sdk.AbbyProvider, { initialData: fixture }, { default: () => h(Demo) }),
}).mount("#app");
