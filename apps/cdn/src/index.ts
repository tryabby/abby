import { Hono } from "hono";
import { ZoneCache } from "./lib/cache";
import { ABBY_WINDOW_KEY, AbbyDataResponse } from "@tryabby/core";

import { cors } from "hono/cors";
import { timing } from "hono/timing";
import { logger } from "hono/logger";
import { ConfigService } from "./lib/config";

const cache = new ZoneCache<{
  config: AbbyDataResponse;
}>({
  cloudflareApiKey: "",
  domain: "cache.tryabby.com",
  fresh: 60 * 1000,
  stale: 60 * 1000,
  zoneId: "",
});

const configCache = new ConfigService(cache);

const app = new Hono()
  .use(
    "*",
    cors({
      origin: "*",
      maxAge: 60 * 60 * 24 * 30,
    })
  )
  .use("*", timing())
  .use("*", logger())
  .get("/:projectId/:environment", async (c) => {
    const environment = c.req.param("environment");
    const projectId = c.req.param("projectId");

    const [data, , reason] = await configCache.retrieveConfig({
      c,
      environment,
      projectId,
    });

    c.header("x-abby-cache", reason);
    return c.json(data);
  })
  .get("/:projectId/:environment/script.js", async (c) => {
    const environment = c.req.param("environment");
    const projectId = c.req.param("projectId");

    const [data, , reason] = await configCache.retrieveConfig({
      c,
      environment,
      projectId,
    });

    c.header("x-abby-cache", reason);

    const script = `window.${ABBY_WINDOW_KEY} = ${JSON.stringify(data)};`;

    return c.text(script, {
      headers: {
        "Content-Type": "application/javascript",
      },
    });
  });

export default app;
