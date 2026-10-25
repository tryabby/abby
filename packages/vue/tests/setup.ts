/// @ts-ignore it doesn't have types
import matchers from "@testing-library/jest-dom/matchers";
import fetch from "node-fetch";
import { afterEach, expect } from "vitest";
import { server } from "./mocks/server";

/// @ts-ignore
global.fetch = fetch;

// Establish API mocking before all tests.
beforeAll(() => server.listen());

// Clean up after the tests are finished.
afterAll(() => server.close());

// extends Vitest's expect method with methods from testing-library
expect.extend(matchers);

// runs a cleanup after each test case
afterEach(() => {
  server.resetHandlers();
});
