import fetch from "node-fetch";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./mocks/server";

// @ts-expect-error global fetch polyfill
global.fetch = fetch;

beforeAll(() => server.listen());

afterAll(() => server.close());

afterEach(() => {
  server.resetHandlers();
});
