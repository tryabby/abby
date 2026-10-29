import { enableAutoUnmount } from "@vue/test-utils";
import fetch from "node-fetch";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./mocks/server";

/// @ts-ignore
global.fetch = fetch;

// Establish API mocking before all tests.
beforeAll(() => server.listen());

// Clean up after the tests are finished.
afterAll(() => server.close());

// unmount every mounted app, which also runs the plugin's cleanup
enableAutoUnmount(afterEach);

afterEach(() => {
  // Reset any request handlers that we may add during the tests,
  // so they don't affect other tests.
  server.resetHandlers();
  vi.restoreAllMocks();
  // remove all cookies so tests don't share stored variants
  if (typeof document === "undefined") return;
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0]?.trim();
    if (name)
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
});
