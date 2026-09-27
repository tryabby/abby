import { createApp, createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { createAbby } from "../src";

afterEach(() => {
  vi.unstubAllEnvs();
});

it.each([
  { environment: "development", force: false, expected: 1 },
  { environment: "production", force: false, expected: 0 },
  { environment: "production", force: true, expected: 1 },
])(
  "mounts and disposes devtools in $environment (force: $force)",
  ({ environment, force, expected }) => {
    vi.stubEnv("NODE_ENV", environment);
    const abby = createAbby({
      projectId: "tools",
      environments: [],
      currentEnvironment: "test",
    });
    const destroy = vi.fn();
    const factory = {
      create: vi.fn(
        (_props: { abby: typeof abby.__abby__; defaultShow?: boolean }) =>
          destroy
      ),
    };
    const Devtools = abby.withDevtools(factory, {
      defaultShow: true,
      dangerouslyForceShow: force,
    });
    const app = createApp({ render: () => h(Devtools) });
    app.mount(document.createElement("div"));
    expect(factory.create).toHaveBeenCalledTimes(expected);
    if (expected)
      expect(factory.create).toHaveBeenCalledWith({
        abby: abby.__abby__,
        defaultShow: true,
      });
    app.unmount();
    expect(destroy).toHaveBeenCalledTimes(expected);
  }
);

it("never constructs devtools during SSR, even when forced", async () => {
  const abby = createAbby({
    projectId: "tools",
    environments: [],
    currentEnvironment: "test",
  });
  const factory = {
    create: vi.fn((_props: { abby: typeof abby.__abby__ }) => vi.fn()),
  };
  const Devtools = abby.withDevtools(factory, { dangerouslyForceShow: true });
  await renderToString(createSSRApp({ render: () => h(Devtools) }));
  expect(factory.create).not.toHaveBeenCalled();
});
