import { expect, afterEach } from "vitest";

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
