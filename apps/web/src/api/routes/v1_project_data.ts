import { Context, Hono } from "hono";
import { timing, startTime, endTime } from "hono/timing";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "server/db/client";
import { ABBY_WINDOW_KEY, AbbyDataResponse } from "@tryabby/core";
import { z } from "zod";
import createCache from "server/common/memory-cache";
import { transformFlagValue } from "lib/flags";
import { jobManager } from "server/queue/Manager";
import { ConfigCache } from "server/common/config-cache";

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
  const cachedConfig = ConfigCache.getConfig({ environment, projectId });
  endTime(c, "readCache");

  c.header(X_ABBY_CACHE_HEADER, cachedConfig !== undefined ? "HIT" : "MISS");
  if (cachedConfig) {
    return cachedConfig;
  }

  startTime(c, "db");
  const [tests, flags] = await Promise.all([
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

  const response = {
    tests: tests.map((test) => ({
      name: test.name,
      weights: test.options.map((o) => o.chance.toNumber()),
    })),
    flags: flags
      .filter(({ flag }) => flag.type === "BOOLEAN")
      .map((flagValue) => {
        return {
          name: flagValue.flag.name,
          value: transformFlagValue(flagValue.value, flagValue.flag.type),
        };
      }),
    remoteConfig: flags
      .filter(({ flag }) => flag.type !== "BOOLEAN")
      .map((flagValue) => {
        return {
          name: flagValue.flag.name,
          value: transformFlagValue(flagValue.value, flagValue.flag.type),
        };
      }),
  } satisfies AbbyDataResponse;

  ConfigCache.setConfig({ environment, projectId, value: response });
  return response;
}

export function makeProjectDataRoute() {
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

          jobManager.emit("after-data-request", {
            apiVersion: "V1",
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

          jobManager.emit("after-data-request", {
            apiVersion: "V1",
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
