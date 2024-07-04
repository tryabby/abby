import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
/// @ts-ignore it doesn't have types
import matchers from "@testing-library/jest-dom/matchers";
import { server } from "./mocks/server";
import fetch from "node-fetch";

/// @ts-ignore
global.fetch = fetch;

// Establish API mocking before all tests.
beforeAll(() => server.listen());
// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => server.resetHandlers());
// Clean up after the tests are finished.
afterAll(() => server.close());

// extends Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});
