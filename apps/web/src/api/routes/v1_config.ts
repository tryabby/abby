import { Hono, MiddlewareHandler } from "hono";
import { zValidator } from "@hono/zod-validator";
import { prisma } from "server/db/client";
import { hashString } from "utils/apiKey";
import * as ConfigService from "server/services/ConfigService";
import { ApiKey } from "@prisma/client";
import { abbyConfigSchema } from "@tryabby/core";

const apiKeyMiddleware: MiddlewareHandler<{
  Variables: {
    apiKey: ApiKey;
  };
}> = async (c, next) => {
  const apiKey = c.req.header("authorization")?.split(" ")[1];

  if (!apiKey) {
    return c.json({ error: "API key not provided" }, { status: 401 });
  }

  const hashedApiKey = hashString(apiKey);

  const apiKeyEntry = await prisma.apiKey.findUnique({
    where: {
      hashedKey: hashedApiKey,
    },
  });

  if (!apiKeyEntry || apiKeyEntry.revokedAt !== null) {
    return c.json(
      { error: "API key revoked" },
      {
        status: 401,
      }
    );
  }

  if (apiKeyEntry.validUntil.getTime() < Date.now()) {
    return c.json(
      { error: "API key expired" },
      {
        status: 401,
      }
    );
  }
  c.set("apiKey", apiKeyEntry);
  await next();
};

export function makeConfigRoute() {
  return new Hono()
    .get("/:projectId", apiKeyMiddleware, async (c) => {
      try {
        const config = await ConfigService.handleGET({
          projectId: c.req.param("projectId"),
        });
        return c.json(config);
      } catch (error) {
        console.error(error);
        return c.json({ error: "Internal server error" }, { status: 500 });
      }
    })
    .put(
      "/:projectId",
      apiKeyMiddleware,
      zValidator("json", abbyConfigSchema),
      async (c) => {
        try {
          const config = c.req.valid("json");

          await ConfigService.handlePUT({
            config: config,
            projectId: c.req.param("projectId"),
            userId: c.get("apiKey").userId,
          });

          return c.json({ message: "Config updated" });
        } catch (error) {
          console.error(error);
          return c.json({ error: "Could not Update Config" }, { status: 500 });
        }
      }
    );
}
