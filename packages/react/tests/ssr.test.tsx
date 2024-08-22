import { ABBY_AB_STORAGE_PREFIX } from "@tryabby/core";
import { renderToString } from "react-dom/server";
import { createAbby } from "../src";

const OLD_ENV = process.env;

beforeEach(() => {
  vi.resetModules(); // Most important - it clears the cache
  process.env = { ...OLD_ENV }; // Make a copy
});

afterAll(() => {
  process.env = OLD_ENV; // Restore old environment
});

describe("useAbby", () => {
  it("renders a random variant on the server", () => {
    const { AbbyProvider, useAbby } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        showFooter: {
          variants: ["current", "new"],
        },
      },
    });

    const ComponentWithFF = () => {
      const { variant } = useAbby("showFooter");
      return (
        <>
          {
            /* @ts-ignore this is just the types for SSR */
            variant === "" && <span>SSR!</span>
          }
          {variant === "current" && <span data-testid="current">Current</span>}
          {variant === "new" && <span data-testid="new">New</span>}
        </>
      );
    };

    const serverSideDOM = renderToString(
      <AbbyProvider
        initialData={{
          flags: [],
          tests: [
            {
              name: "showFooter",
              weights: [0.5, 0.5],
            },
          ],
          remoteConfig: [],
        }}
      >
        <ComponentWithFF />
      </AbbyProvider>
    );

    // match either variant
    expect(/(Current|New)/.test(serverSideDOM)).toBe(true);
  });

  it("renders a the correct variant on the server if set", () => {
    const { AbbyProvider, useAbby, __abby__ } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      tests: {
        showFooter: {
          variants: ["current", "new"],
        },
      },
    });

    __abby__.setLocalOverrides(
      `${ABBY_AB_STORAGE_PREFIX}123_showFooter=current`
    );

    const ComponentWithFF = () => {
      const { variant } = useAbby("showFooter");
      return (
        <>
          {
            /* @ts-ignore this is just the types for SSR */
            variant === "" && <span>SSR!</span>
          }
          {variant === "current" && <span data-testid="current">Current</span>}
          {variant === "new" && <span data-testid="new">New</span>}
        </>
      );
    };

    const serverSideDOM = renderToString(
      <AbbyProvider
        initialData={{
          flags: [],
          tests: [
            {
              name: "showFooter",
              weights: [0.5, 0.5],
            },
          ],
          remoteConfig: [],
        }}
      >
        <ComponentWithFF />
      </AbbyProvider>
    );

    // match either variant
    expect(serverSideDOM).toContain("Current");
    expect(serverSideDOM).not.toContain("New");
  });
});

describe("useFeatureFlag", () => {
  it("renders the correct feature flag on the server", () => {
    const { AbbyProvider, useFeatureFlag } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      flags: ["test", "test2"],
    });

    const ComponentWithFF = () => {
      const test = useFeatureFlag("test");
      const test2 = useFeatureFlag("test2");

      return (
        <>
          {test && <span data-testid="test">Secret</span>}
          {test2 && <span data-testid="test2">SUPER SECRET</span>}
        </>
      );
    };

    const serverSideDOM = renderToString(
      <AbbyProvider
        initialData={{
          flags: [
            {
              value: true,
              name: "test",
            },
            {
              value: false,
              name: "test2",
            },
          ],
          tests: [],
          remoteConfig: [],
        }}
      >
        <ComponentWithFF />
      </AbbyProvider>
    );

    expect(serverSideDOM).toContain("Secret");
    expect(serverSideDOM).not.toContain("SUPER SECRET");
  });
});

describe("getRemoteConfig", () => {
  it("renders the correct remoteConfig value on the server", () => {
    const { AbbyProvider, useRemoteConfig } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      remoteConfig: { remoteConfig1: "String" },
    });

    const ComponentWithRC = () => {
      const remoteConfig1 = useRemoteConfig("remoteConfig1");

      return (
        <>
          <span data-testid="test">{remoteConfig1}</span>
        </>
      );
    };

    const serverSideDOM = renderToString(
      <AbbyProvider
        initialData={{
          flags: [
            {
              value: true,
              name: "test",
            },
            {
              value: false,
              name: "test2",
            },
          ],
          tests: [],
          remoteConfig: [{ name: "remoteConfig1", value: "FooBar" }],
        }}
      >
        <ComponentWithRC />
      </AbbyProvider>
    );

    expect(serverSideDOM).toContain("FooBar");
  });
});
