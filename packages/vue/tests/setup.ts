/// @ts-ignore it doesn't have types
import matchers from "@testing-library/jest-dom/matchers";
import { config } from "@vue/test-utils";
import fetch from "node-fetch";
import { afterEach, beforeAll } from "vitest";
import { server } from "./mocks/server";

/// @ts-ignore node-fetch is not type compatible with the global fetch
global.fetch = fetch;

// Establish API mocking before all tests.
beforeAll(() => server.listen());

// Clean up after the tests are finished.
afterAll(() => server.close());

// extends Vitest's expect method with methods from testing-library
expect.extend(matchers);

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  // Reset any request handlers that we may add during the tests,
  // so they don't affect other tests.
  server.resetHandlers();
  document.cookie = "";
});

config.global.stubs = {};
