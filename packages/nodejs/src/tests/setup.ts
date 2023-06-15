import { expect, afterEach } from "vitest";

import { server } from "./mocks/server.ts";
import fetch from "node-fetch";

/// @ts-ignore
global.fetch = fetch;

// Establish API mocking before all tests.
beforeAll(() =>
  server.listen({
    onUnhandledRequest(req) {
      //requests to express should not be intercepted and there should be no warning
      const excludedRoutes = ["/cookie", "/featureFlag"];
      const routeIsExcluded = excludedRoutes.some((route) => req.url.pathname.includes(route));
      if (routeIsExcluded) {
        return;
      }
      console.error("Found an unhandled %s request to %s", req.method, req.url.href);
    },
  })
);
// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => server.resetHandlers());
// Clean up after the tests are finished.
afterAll(() => server.close());
