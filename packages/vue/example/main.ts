import { createApp, defineComponent, h, ref } from "vue";
import { createAbby } from "../dist/index.mjs";

const abby = createAbby({
  projectId: "vue-example",
  apiUrl: `${window.location.origin}/`,
  environments: ["local"],
  currentEnvironment: "local",
  flags: ["banner"],
  tests: { checkout: { variants: ["classic", "compact"] } },
  remoteConfig: { title: "String" },
  cookies: { disableByDefault: true },
});

const Example = defineComponent({
  setup() {
    const banner = abby.useFeatureFlag("banner");
    const title = abby.useRemoteConfig("title");
    const { variant, onAct } = abby.useAbby("checkout");
    const busy = ref(false);
    const message = ref("");
    const events = ref("No events read yet.");
    async function changeData() {
      busy.value = true;
      try {
        const response = await fetch("/fixture/toggle", { method: "POST" });
        if (!response.ok) throw new Error("Could not update the fixture");
        await abby.__abby__.loadProjectData();
        message.value = "Loaded the updated fixture.";
      } catch (error) {
        message.value = String(error);
      } finally {
        busy.value = false;
      }
    }
    async function readEvents() {
      try {
        const response = await fetch("/fixture/events");
        if (!response.ok) throw new Error("Could not read events");
        events.value = JSON.stringify(await response.json(), null, 2);
      } catch (error) {
        message.value = String(error);
      }
    }
    const row = (label: string, value: unknown) =>
      h("tr", [
        h("th", { scope: "row" }, h("code", label)),
        h("td", String(value)),
      ]);
    return () => [
      h("table", [
        h("tbody", [
          row('useFeatureFlag("banner")', banner.value),
          row('useRemoteConfig("title")', title.value),
          row('useAbby("checkout").variant', variant.value ?? "Loading…"),
        ]),
      ]),
      h("div", { class: "actions" }, [
        h(
          "button",
          { type: "button", disabled: busy.value, onClick: changeData },
          busy.value ? "Loading fixture…" : "Change server data"
        ),
        h(
          "button",
          {
            type: "button",
            disabled: variant.value === undefined,
            onClick: () => {
              onAct();
              message.value =
                "Conversion requested. Read events to verify receipt.";
            },
          },
          "Record conversion"
        ),
        h("button", { type: "button", onClick: readEvents }, "Read events"),
      ]),
      h("p", { id: "message", role: "status" }, message.value),
      h("h2", "Server event log"),
      h(
        "p",
        "Type 0 is an exposure. Type 1 is a conversion. Read events after recording a conversion to see the server receipt."
      ),
      h("pre", { "data-testid": "events" }, events.value),
    ];
  },
});
createApp({ render: () => h(abby.AbbyProvider, {}, () => h(Example)) }).mount(
  "#app"
);
