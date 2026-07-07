import { HttpService } from "@tryabby/core";
import fetch from "node-fetch";
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";
import { server } from "./mocks/server";

// @ts-ignore node-fetch's types differ slightly from the DOM fetch signature
global.fetch = fetch;

// Establish API mocking before all tests.
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));

// Silence the analytics ping/act network calls by default. Individual tests
// can still spy on `HttpService.sendData` to assert against the recorded calls.
beforeEach(() => {
  vi.spyOn(HttpService, "sendData").mockImplementation(() => undefined);
});

// Clean up after every test case.
afterEach(() => {
  vi.restoreAllMocks();
  server.resetHandlers();
});

// Close the mocking server once the whole suite is done.
afterAll(() => server.close());
