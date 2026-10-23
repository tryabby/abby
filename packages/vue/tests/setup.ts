import fetch from "node-fetch";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./mocks/server";

// Polyfill global.fetch for msw and node
// @ts-ignore
global.fetch = fetch;

beforeAll(() => server.listen());

afterAll(() => server.close());

afterEach(() => {
  server.resetHandlers();
});
