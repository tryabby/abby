import fetch from "node-fetch";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "./mocks/server";

// @ts-ignore
global.fetch = fetch;

beforeAll(() => server.listen());

afterAll(() => server.close());

afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});
