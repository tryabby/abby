import fetch from "node-fetch";
import { afterEach } from "vitest";
/// @ts-ignore it doesn't have types
import { server } from "./mocks/server";

/// @ts-ignore
global.fetch = fetch;

// Establish API mocking before all tests.
beforeAll(() => server.listen());

// Clean up after the tests are finished.
afterAll(() => server.close());

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  // Reset any request handlers that we may add during the tests,
  // so they don't affect other tests.
  server.resetHandlers();
});
