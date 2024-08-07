import { afterEach } from "vitest";

import fetch from "node-fetch";
import { server } from "./mocks/server";

/// @ts-ignore
global.fetch = fetch;

// Establish API mocking before all tests.
beforeAll(() => server.listen());

afterAll(() => server.close());

// Clean up after the tests are finished.
afterEach(() => {
  // Reset any request handlers that we may add during the tests,
  // so they don't affect other tests.
  server.resetHandlers();
});
