/// @ts-ignore it does not have types
import matchers from "@testing-library/jest-dom/matchers";
import fetch from "node-fetch";
import { afterAll, afterEach, beforeAll, expect } from "vitest";
import { server } from "./mocks/server";

/// @ts-ignore
global.fetch = fetch;

// Establish API mocking before all tests.
beforeAll(() => server.listen());

// Clean up after the tests are finished.
afterAll(() => server.close());

// extends Vitest expect method with methods from jest-dom
expect.extend(matchers);

afterEach(() => {
  // Reset any request handlers that we may add during the tests,
  // so they do not affect other tests.
  server.resetHandlers();
});
