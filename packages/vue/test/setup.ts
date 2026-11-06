/// @ts-ignore it doesn't have types
import fetch from "node-fetch";
import { server } from "./mocks/server";

/// @ts-ignore
global.fetch = fetch;

beforeAll(() => server.listen());
afterAll(() => server.close());
afterEach(() => server.resetHandlers());
