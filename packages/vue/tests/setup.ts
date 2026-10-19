/// @ts-ignore it doesn't have types
import matchers from "@testing-library/jest-dom/matchers";
import fetch from "node-fetch";
import { afterAll, afterEach, beforeAll, expect } from "vitest";
import { server } from "./mocks/server";

/// @ts-ignore
global.fetch = fetch;

beforeAll(() => server.listen());

afterAll(() => server.close());

expect.extend(matchers);

afterEach(() => {
  server.resetHandlers();
});
