import {
  Abby,
  AbbyEventType,
  HttpService,
  getABStorageKey,
} from "@tryabby/core";
import Cookie from "js-cookie";
import { createApp, defineComponent, effectScope, h, nextTick, ref } from "vue";
import { createAbby } from "../src";
import { createSdk, projectData } from "./fixtures";

const cleanups: Array<() => void> = [];

beforeEach(() => {
  vi.spyOn(HttpService, "sendData").mockImplementation(() => undefined);
  vi.spyOn(HttpService, "getProjectData").mockResolvedValue(null);
  for (const name of Object.keys(Cookie.get())) Cookie.remove(name);
});

afterEach(() => {
  for (const stop of cleanups.splice(0)) stop();
  vi.unstubAllEnvs();
  document.body.replaceChildren();
});

function mountSdk(sdk = createSdk(), initialData = projectData()) {
  let client!: ReturnType<typeof sdk.useAbbyClient>;
  let flag!: ReturnType<typeof sdk.useFeatureFlag>;
  let greeting!: ReturnType<typeof sdk.useRemoteConfig<"greeting">>;
  let experiment!: ReturnType<typeof sdk.useAbby<"headline">>;
  const target = document.createElement("div");
  document.body.append(target);
  const app = createApp(
    defineComponent({
      setup() {
        client = sdk.useAbbyClient();
        flag = sdk.useFeatureFlag("new-ui");
        greeting = sdk.useRemoteConfig("greeting");
        const count = sdk.useRemoteConfig("count");
        const layout = sdk.useRemoteConfig("layout");
        experiment = sdk.useAbby("headline");
        return () =>
          h(
            "output",
            [
              String(flag.value),
              greeting.value,
              String(count.value),
              JSON.stringify(layout.value),
              experiment.variant.value ?? "pending",
            ].join("|")
          );
      },
    })
  );
  app.use(sdk.AbbyPlugin, { initialData });
  app.mount(target);
  cleanups.push(() => app.unmount());
  return { app, target, client, flag, greeting, experiment, sdk };
}

it("updates the actual Vue DOM when core flags and every remote-config type change", async () => {
  const view = mountSdk();
  await nextTick();
  expect(view.target.textContent).toContain(
    'false|Hello|3|{"columns":2}|control'
  );
  view.client.updateFlag("new-ui", true);
  view.client.updateRemoteConfig("greeting", "Updated");
  view.client.updateRemoteConfig("count", 8);
  view.client.updateRemoteConfig("layout", { columns: 4 });
  await nextTick();
  expect(view.target.textContent).toBe('true|Updated|8|{"columns":4}|control');
});

it("invalidates cached computed refs across repeated in-place core updates", async () => {
  const view = mountSdk();
  expect(view.flag.value).toBe(false);
  view.client.updateFlag("new-ui", true);
  await nextTick();
  expect(view.flag.value).toBe(true);
  view.client.updateFlag("new-ui", false);
  await nextTick();
  expect(view.flag.value).toBe(false);
  expect(view.target.textContent).toMatch(/^false\|/);
});

it("loads once on client mount when initial data is absent", async () => {
  vi.mocked(HttpService.getProjectData).mockResolvedValue(projectData(true));
  const sdk = createSdk();
  const target = document.createElement("div");
  document.body.append(target);
  const app = createApp({
    setup: () => {
      const flag = sdk.useFeatureFlag("new-ui");
      const count = sdk.useRemoteConfig("count");
      return () => h("span", `${flag.value}:${count.value}`);
    },
  });
  app.use(sdk);
  app.mount(target);
  cleanups.push(() => app.unmount());
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
  expect(HttpService.getProjectData).toHaveBeenCalledTimes(1);
  expect(target.textContent).toBe("true:3");
});

it("uses supplied initial data without fetching", () => {
  mountSdk();
  expect(HttpService.getProjectData).not.toHaveBeenCalled();
});

it("sends exposure and action for the selected variant and updates the lookup", async () => {
  vi.stubEnv("NODE_ENV", "development");
  const view = mountSdk();
  await nextTick();
  view.experiment.onAct();
  expect(HttpService.sendData).toHaveBeenCalledWith(
    expect.objectContaining({
      type: AbbyEventType.ACT,
      data: {
        projectId: "vue-test",
        testName: "headline",
        selectedVariant: "control",
      },
    })
  );
  view.client.updateLocalVariant("headline", "candidate");
  await nextTick();
  expect(view.target.textContent).toMatch(/candidate$/);
  expect(HttpService.sendData).toHaveBeenCalledWith(
    expect.objectContaining({
      type: AbbyEventType.PING,
      data: {
        projectId: "vue-test",
        testName: "headline",
        selectedVariant: "candidate",
      },
    })
  );
});

it("keeps apps installed from one factory isolated including mutable test weights", async () => {
  const sdk = createSdk();
  const left = mountSdk(sdk, projectData(false));
  const rightData = projectData(true);
  rightData.tests[0].weights = [0, 1];
  rightData.remoteConfig[0].value = "Other app";
  const right = mountSdk(sdk, rightData);
  await nextTick();
  expect(left.target.textContent).toBe('false|Hello|3|{"columns":2}|control');
  expect(right.target.textContent).toBe(
    'true|Other app|3|{"columns":2}|candidate'
  );
  left.client.updateFlag("new-ui", true);
  left.client.updateRemoteConfig("greeting", "Only left");
  await nextTick();
  expect(right.target.textContent).toContain("Other app");
  expect(left.client).not.toBe(right.client);
});

it("cleans subscriptions when a component and the app unmount", async () => {
  const stopCalls: Array<ReturnType<typeof vi.fn>> = [];
  const subscribe = Abby.prototype.subscribe;
  vi.spyOn(Abby.prototype, "subscribe").mockImplementation(function (
    this: Abby<any, any, any, any, any>,
    listener
  ) {
    const stop = vi.fn(subscribe.call(this, listener));
    stopCalls.push(stop);
    return stop;
  });
  const view = mountSdk();
  expect(stopCalls.length).toBeGreaterThan(0);
  cleanups.pop()?.();
  expect(stopCalls.every((stop) => stop.mock.calls.length === 1)).toBe(true);
  const oldValue = view.flag.value;
  view.client.updateFlag("new-ui", !oldValue);
  await nextTick();
  expect(view.flag.value).toBe(oldValue);
});

it("unsubscribes a stopped effect scope while the app remains mounted", async () => {
  const view = mountSdk();
  const scope = effectScope();
  const flag = view.app.runWithContext(() =>
    scope.run(() => view.sdk.useFeatureFlag("new-ui"))
  )!;
  expect(flag.value).toBe(false);
  scope.stop();
  view.client.updateFlag("new-ui", true);
  await nextTick();
  expect(view.flag.value).toBe(true);
  expect(flag.value).toBe(false);
});

it("isolates nested providers from the app plugin", async () => {
  const sdk = createSdk();
  const outer = projectData(false);
  const inner = projectData(true);
  const Child = defineComponent({
    setup() {
      const flag = sdk.useFeatureFlag("new-ui");
      return () => h("span", String(flag.value));
    },
  });
  const target = document.createElement("div");
  const app = createApp({
    setup: () => () =>
      h("div", [
        h(Child),
        h(sdk.AbbyProvider, { initialData: inner }, () => h(Child)),
      ]),
  });
  app.use(sdk, { initialData: outer });
  app.mount(target);
  cleanups.push(() => app.unmount());
  await nextTick();
  expect(target.textContent).toBe("falsetrue");
});

it("does not write experiment cookies when consent is disabled", async () => {
  mountSdk();
  await nextTick();
  expect(Cookie.get(getABStorageKey("vue-test", "headline"))).toBeUndefined();
});

it("persists consented experiment choices by project and honors cookie expiry", async () => {
  const set = vi.spyOn(document, "cookie", "set");
  const sdk = createAbby({
    projectId: "cookie-project",
    currentEnvironment: "test",
    environments: ["test"],
    tests: { headline: { variants: ["control", "candidate"] } },
    cookies: { expiresInDays: 2 },
  });
  const target = document.createElement("div");
  const app = createApp({
    setup: () => {
      const test = sdk.useAbby("headline");
      return () => h("span", test.variant.value);
    },
  });
  app.use(sdk, { initialData: projectData() });
  app.mount(target);
  cleanups.push(() => app.unmount());
  await nextTick();
  expect(Cookie.get(getABStorageKey("cookie-project", "headline"))).toBe(
    "control"
  );
  const assignment = set.mock.calls
    .map(([value]) => value)
    .find((value) =>
      value.startsWith(
        `${encodeURIComponent(getABStorageKey("cookie-project", "headline"))}=`
      )
    );
  expect(assignment).toContain("Path=/");
  expect(assignment).toContain("SameSite=Lax");
  const expires = assignment?.match(/Expires=([^;]+)/)?.[1];
  expect(expires).toBeDefined();
  expect(
    Math.abs(Date.parse(expires!) - (Date.now() + 2 * 86_400_000))
  ).toBeLessThan(2000);
  expect(
    Cookie.get(getABStorageKey("other-project", "headline"))
  ).toBeUndefined();
});

it("gives a helpful error outside a provider or app installation", () => {
  const sdk = createSdk();
  expect(() => sdk.useFeatureFlag("new-ui")).toThrow(/Abby|install|provider/i);
});

it("reactively applies typed user segmentation through core", async () => {
  const data = projectData();
  data.flags[0].ruleSet = [
    {
      propertyName: "age",
      propertyType: "number",
      operator: "gte",
      value: 18,
      thenValue: true,
    },
  ];
  const view = mountSdk(createSdk(), data);
  expect(view.flag.value).toBe(false);
  view.sdk.updateUserProperties({ age: 25 }, view.app);
  await nextTick();
  expect(view.target.textContent).toMatch(/^true\|/);
});

it("renders mapped variants and aggregate flag/config lists reactively", async () => {
  const sdk = createSdk();
  let client!: ReturnType<typeof sdk.useAbbyClient>;
  const target = document.createElement("div");
  const app = createApp({
    setup() {
      client = sdk.useAbbyClient();
      const test = sdk.useAbby("headline", {
        control: "Original",
        candidate: "Improved",
      });
      const flags = sdk.useFeatureFlags();
      const configs = sdk.useRemoteConfigVariables();
      return () =>
        h(
          "output",
          `${test.variant.value ?? "pending"}|${JSON.stringify(flags.value)}|${JSON.stringify(configs.value)}`
        );
    },
  });
  app.use(sdk, { initialData: projectData() });
  app.mount(target);
  cleanups.push(() => app.unmount());
  await nextTick();
  expect(target.textContent).toMatch(/^Original\|/);
  client.updateFlag("new-ui", true);
  const next = projectData(true);
  next.tests[0].weights = [0, 1];
  client.init(next);
  await nextTick();
  expect(target.textContent).toMatch(/^Improved\|/);
  expect(target.textContent).toContain('"name":"new-ui","value":true');
  expect(target.textContent).toContain('"name":"count","value":3');
});

it("stops retained action callbacks after only the consumer component unmounts", async () => {
  const sdk = createSdk();
  const show = ref(true);
  let act!: () => void;
  const Child = {
    setup() {
      const test = sdk.useAbby("headline");
      act = test.onAct;
      return () => h("span", test.variant.value);
    },
  };
  const app = createApp({
    setup: () => () => (show.value ? h(Child) : h("span", "removed")),
  });
  app.use(sdk, { initialData: projectData() });
  app.mount(document.createElement("div"));
  cleanups.push(() => app.unmount());
  await nextTick();
  act();
  const before = vi.mocked(HttpService.sendData).mock.calls.length;
  show.value = false;
  await nextTick();
  act();
  expect(HttpService.sendData).toHaveBeenCalledTimes(before);
});

it("ignores obsolete experiment cookies and another project's flag override", async () => {
  Cookie.set(getABStorageKey("guarded-project", "headline"), "removed-variant");
  Cookie.set(
    `other_${getABStorageKey("guarded-project", "headline")}`,
    "candidate"
  );
  const sdk = createAbby({
    projectId: "guarded-project",
    currentEnvironment: "test",
    environments: ["test"],
    tests: { headline: { variants: ["control", "candidate"] } },
  });
  const target = document.createElement("div");
  const app = createApp({
    setup() {
      const test = sdk.useAbby("headline");
      return () => h("span", test.variant.value);
    },
  });
  app.use(sdk, { initialData: projectData() });
  app.mount(target);
  cleanups.push(() => app.unmount());
  await nextTick();
  expect(target.textContent).toBe("control");
});

it("retains usable defaults when the official data request yields no result", async () => {
  const sdk = createSdk();
  const target = document.createElement("div");
  const app = createApp({
    setup() {
      const flag = sdk.useFeatureFlag("new-ui");
      const count = sdk.useRemoteConfig("count");
      return () => h("output", `${flag.value}:${count.value}`);
    },
  });
  app.use(sdk);
  app.mount(target);
  cleanups.push(() => app.unmount());
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
  expect(target.textContent).toBe("false:0");
  expect(HttpService.getProjectData).toHaveBeenCalledTimes(1);
});

it("waits for fetched experiment weights before persisting or exposing a variant", async () => {
  let deliver!: (value: ReturnType<typeof projectData>) => void;
  vi.mocked(HttpService.getProjectData).mockImplementation(
    () =>
      new Promise((resolve) => {
        deliver = resolve;
      })
  );
  vi.spyOn(Math, "random").mockReturnValue(0);
  const sdk = createAbby({
    projectId: "async-project",
    currentEnvironment: "test",
    environments: ["test"],
    tests: { headline: { variants: ["control", "candidate"] } },
  });
  const target = document.createElement("div");
  const app = createApp({
    setup() {
      const test = sdk.useAbby("headline");
      return () => h("output", test.variant.value ?? "pending");
    },
  });
  app.use(sdk);
  app.mount(target);
  cleanups.push(() => app.unmount());
  await nextTick();
  expect(target.textContent).toBe("pending");
  expect(
    Cookie.get(getABStorageKey("async-project", "headline"))
  ).toBeUndefined();
  expect(HttpService.sendData).not.toHaveBeenCalled();
  const data = projectData();
  data.tests[0].weights = [0, 1];
  deliver(data);
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
  expect(target.textContent).toBe("candidate");
  expect(Cookie.get(getABStorageKey("async-project", "headline"))).toBe(
    "candidate"
  );
  expect(HttpService.sendData).toHaveBeenCalledWith(
    expect.objectContaining({
      type: AbbyEventType.PING,
      data: {
        projectId: "async-project",
        testName: "headline",
        selectedVariant: "candidate",
      },
    })
  );
});

it("retains typed defaults when valid initial data omits configured remote keys", async () => {
  const data = projectData();
  data.remoteConfig = [];
  const view = mountSdk(createSdk(), data);
  await nextTick();
  expect(view.target.textContent).toBe("false||0|{}|control");
});

it("retains typed defaults when a successful remote response omits configured keys", async () => {
  const data = projectData();
  data.remoteConfig = [];
  vi.mocked(HttpService.getProjectData).mockResolvedValue(data);
  const sdk = createSdk();
  const target = document.createElement("div");
  const app = createApp({
    setup() {
      const greeting = sdk.useRemoteConfig("greeting");
      const count = sdk.useRemoteConfig("count");
      const layout = sdk.useRemoteConfig("layout");
      return () =>
        h(
          "output",
          `${greeting.value}|${count.value}|${JSON.stringify(layout.value)}`
        );
    },
  });
  app.use(sdk);
  app.mount(target);
  cleanups.push(() => app.unmount());
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
  expect(target.textContent).toBe("|0|{}");
});
