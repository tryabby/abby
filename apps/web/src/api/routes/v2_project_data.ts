import { zValidator } from "@hono/zod-validator";
import {
  ABBY_WINDOW_KEY,
  type AbbyData,
  hashStringToInt32,
  serializeAbbyData,
} from "@tryabby/core";
import { type Context, Hono } from "hono";
import { cors } from "hono/cors";
import { endTime, startTime, timing } from "hono/timing";
import { transformFlagValue } from "lib/flags";
import { ConfigCache } from "server/common/config-cache";
import { prisma } from "server/db/client";
import { afterDataRequestQueue } from "server/queue/queues";
import { z } from "zod";

export const X_ABBY_CACHE_HEADER = "X-Abby-Cache";

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
  const cachedConfig = ConfigCache.getConfig({
    environment,
    projectId,
    apiVersion: "v2",
  });
  endTime(c, "readCache");

  c.header(X_ABBY_CACHE_HEADER, cachedConfig !== undefined ? "HIT" : "MISS");
  if (cachedConfig) {
    return serializeAbbyData(cachedConfig as AbbyData);
  }

  startTime(c, "db");
  const [dbTests, dbFlags] = await Promise.all([
    prisma.test.findMany({
      where: {
        projectId,
      },
      include: { options: { select: { chance: true } } },
    }),
    prisma.featureFlagValue.findMany({
      where: {
        environment: {
          name: environment,
          projectId,
        },
      },
      include: { flag: { select: { name: true, type: true } } },
    }),
  ]);
  endTime(c, "db");

  const flags = dbFlags.filter(({ flag }) => flag.type === "BOOLEAN");

  const remoteConfigs = dbFlags.filter(({ flag }) => flag.type !== "BOOLEAN");

  const response = {
    tests: dbTests.map((test) => ({
      name: hashStringToInt32(test.name).toString(),
      weights: test.options.map((o) => o.chance.toNumber()),
    })),
    flags: flags.map((flagValue) => {
      return {
        name: hashStringToInt32(flagValue.flag.name).toString(),
        value: transformFlagValue(flagValue.value, flagValue.flag.type),
      };
    }),
    remoteConfig: remoteConfigs.map((flagValue) => {
      return {
        name: hashStringToInt32(flagValue.flag.name).toString(),
        value: transformFlagValue(flagValue.value, flagValue.flag.type),
      };
    }),
  } satisfies AbbyData;

  ConfigCache.setConfig({
    environment,
    projectId,
    value: response,
    apiVersion: "v2",
  });
  return serializeAbbyData(response);
}

export function makeV2ProjectDataRoute() {
  const app = new Hono()
    .get(
      "/:projectId",
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

          const duration = performance.now() - now;

          afterDataRequestQueue.add("after-data-request", {
            apiVersion: "V2",
            functionDuration: duration,
            projectId,
          });

          return c.json(response);
        } catch (e) {
          console.error(e);
          return c.json({ error: "Internal server error" }, { status: 500 });
        }
      }
    )
    .get(
      "/:projectId/script.js",
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

          const jsContent = `window.${ABBY_WINDOW_KEY} = ${JSON.stringify(
            response
          )}`;

          const duration = performance.now() - now;

          afterDataRequestQueue.add("after-data-request", {
            apiVersion: "V2",
            functionDuration: duration,
            projectId,
          });

          return c.text(jsContent, {
            headers: {
              "Content-Type": "application/javascript",
            },
          });
        } catch (e) {
          console.error(e);
          return c.json({ error: "Internal server error" }, { status: 500 });
        }
      }
    );
  return app;
}
