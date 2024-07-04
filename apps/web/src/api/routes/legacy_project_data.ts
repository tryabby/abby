import { Context, Hono } from "hono";
import { endTime, startTime, timing } from "hono/timing";

import { zValidator } from "@hono/zod-validator";
import { cors } from "hono/cors";
import { prisma } from "server/db/client";

import { LegacyAbbyDataResponse } from "@tryabby/core";
import { transformFlagValue } from "lib/flags";
import createCache from "server/common/memory-cache";

import { z } from "zod";
import { afterDataRequestQueue } from "server/queue/queues";

const configCache = createCache<string, LegacyAbbyDataResponse>({
  name: "legacyConfigCache",
  expireAfterMilliseconds: 1000 * 10,
});

async function getAbbyResponseWithCache({
  environment,
  projectId,
  c,
}: {
  environment: string;
  projectId: string;
  c: Context;
}) {
  startTime(c, "readCache");
  const cachedConfig = configCache.get(projectId + environment);
  endTime(c, "readCache");

  c.header("X-Abby-Cache", cachedConfig !== undefined ? "HIT" : "MISS");
  if (cachedConfig) {
    return cachedConfig;
  }

  startTime(c, "db");
  const [tests, flags] = await Promise.all([
    prisma.test.findMany({
      where: {
        projectId,
      },
      include: { options: true },
    }),
    prisma.featureFlagValue.findMany({
      where: {
        environment: {
          name: environment,
          projectId,
        },
        flag: {
          type: "BOOLEAN",
        },
      },
      include: { flag: { select: { name: true, type: true } } },
    }),
  ]);

  endTime(c, "db");
  const response = {
    tests: tests.map((test) => ({
      name: test.name,
      weights: test.options.map((o) => o.chance.toNumber()),
    })),
    flags: flags.map((flagValue) => {
      const value = transformFlagValue(flagValue.value, flagValue.flag.type);
      return {
        name: flagValue.flag.name,
        isEnabled:
          flagValue.flag.type === "BOOLEAN" ? value === true : value !== null,
      };
    }),
  } satisfies LegacyAbbyDataResponse;

  configCache.set(projectId + environment, response);
  return response;
}

export function makeLegacyProjectDataRoute() {
  const app = new Hono().get(
    "/:projectId/data",
    cors({
      origin: "*",
      maxAge: 86400,
    }),
    zValidator(
      "query",
      z.object({
        environment: z.string(),
      })
    ),
    timing(),
    async (c) => {
      const projectId = c.req.param("projectId");
      const { environment } = c.req.valid("query");

      const now = performance.now();

      try {
        startTime(c, "getAbbyResponseWithCache");
        const response = await getAbbyResponseWithCache({
          projectId,
          environment,
          c,
        });
        endTime(c, "getAbbyResponseWithCache");

        afterDataRequestQueue.add("after-data-request", {
          apiVersion: "V0",
          functionDuration: performance.now() - now,
          projectId,
        });

        return c.json(response);
      } catch (e) {
        console.error(e);
        return c.json({ error: "Internal server error" }, { status: 500 });
      }
    }
  );
  return app;
}
