import { abbyConfigSchema } from "@tryabby/core";
import { NextApiRequest, NextApiResponse } from "next";
import NextCors from "nextjs-cors";
import { prisma } from "server/db/client";
import * as ConfigService from "server/services/ConfigService";
import { hashApiKey } from "utils/apiKey";
import { z } from "zod";

const incomingQuerySchema = z.object({
  projectId: z.string(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await NextCors(req, res, {
    methods: ["GET", "PUT"],
    origin: "*",
    optionsSuccessStatus: 200,
    allowedHeaders: ["authorization"],
  });
  const querySchemaResult = incomingQuerySchema.safeParse(req.query);

  if (!querySchemaResult.success) {
    res.status(400).json({ error: "Invalid Query Parameters" });
    return;
  }

  const { projectId } = querySchemaResult.data;

  const apiKey = req.headers["authorization"]?.split(" ")[1];

  if (!apiKey) {
    res.status(401).json({ error: "API key not provided" });
    return;
  }

  const hashedApiKey = hashApiKey(apiKey);

  const apiKeyEntry = await prisma.apiKey.findUnique({
    where: {
      hashedKey: hashedApiKey,
    },
  });

  if (!apiKeyEntry || apiKeyEntry.revokedAt !== null) {
    res.status(401).json({ error: "API key revoked" });
    return;
  }

  if (apiKeyEntry.validUntil.getTime() < Date.now()) {
    res.status(401).json({ error: "API key expired" });
    return;
  }

  switch (req.method) {
    case "GET": {
      try {
        const config = await ConfigService.handleGET({ projectId });
        return res.status(200).json(config);
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
      }
    }
    case "PUT": {
      try {
        const configSchemaResult = abbyConfigSchema.safeParse(req.body);

        if (!configSchemaResult.success) {
          res.status(400).end();
          return;
        }

        await ConfigService.handlePUT({
          config: configSchemaResult.data,
          projectId,
          userId: apiKeyEntry.userId,
        });

        return res.status(200).json({ message: "Config updated" });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Could not Update Config" });
      }
    }
  }
}
