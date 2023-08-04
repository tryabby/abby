/**
 * @vitest-environment node
 */

import { useEffect, useState } from "react";
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
  it("doesn't render a variant on the server", () => {
    const { AbbyProvider, useAbby } = createAbby({
      environments: [],
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
          {variant === "current" && <span data-testid="current">Secret</span>}
          {variant === "new" && <span data-testid="new">Very Secret</span>}
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
        }}
      >
        <ComponentWithFF />
      </AbbyProvider>
    );

    expect(serverSideDOM).toContain("SSR!");
    expect(serverSideDOM).not.toContain("Secret");
    expect(serverSideDOM).not.toContain("Very Secret");
  });
});

describe("useFeatureFlag", () => {
  it("renders the correct feature flag on the server", () => {
    const { AbbyProvider, useFeatureFlag } = createAbby({
      environments: [],
      projectId: "123",
      flags: {
        test: "Boolean",
        test2: "Boolean",
      },
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
        }}
      >
        <ComponentWithFF />
      </AbbyProvider>
    );

    expect(serverSideDOM).toContain("Secret");
    expect(serverSideDOM).not.toContain("SUPER SECRET");
  });
});
