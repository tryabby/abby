import { Variants, useElementScroll } from "framer-motion";
import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "server/db/client";

import NextCors from "nextjs-cors";
import { z } from "zod";
import { FlagService } from "server/services/FlagService";
import { TestService } from "server/services/TestService";
import { hashApiKey } from "utils/apiKey";

const incomingQuerySchema = z.object({
  projectId: z.string(),
  apiKey: z.string(),
});

export const abbyConfigSchema = z.object({
  projectId: z.string(),
  tests: z.record(
    z.object({
      variants: z.array(z.string()),
    })
  ),
  flags: z.array(z.string()),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await NextCors(req, res, {
    methods: ["GET", "PUT"],
    origin: "*",
    optionsSuccessStatus: 200,
  });
  const querySchemaResult = incomingQuerySchema.safeParse(req.query);
  if (!querySchemaResult.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }

  const { projectId, apiKey } = querySchemaResult.data;

  const hashedApiKey = hashApiKey(apiKey);
  const apiKeyEntry = await prisma.aPIKey.findUnique({
    where: {
      hashedKey: hashedApiKey,
    },
  });

  // TODO remove this check
  if (!apiKeyEntry) {
    res.status(401).json(hashedApiKey);
    return;
  } else {
    if (apiKeyEntry.isRevoked) {
      res.status(401).json({ error: "API key revoked" });
      return;
    }
  }

  if (req.method === "GET") {
    // TODO add event service ?
    try {
      const projectData = await prisma.project.findUnique({
        where: {
          id: projectId,
        },
        include: {
          tests: {
            include: {
              options: true,
            },
          },
          featureFlags: true,
        },
      });

      if (!projectData) throw new Error();

      const config = {
        projectId,
        tests: projectData.tests.reduce((acc, test) => {
          acc[test.name] = {
            variants: test.options.map((option) => option.identifier),
          };
          return acc;
        }, {} as Record<string, any>),
        flags: Array.from(
          new Set(projectData.featureFlags.map((flag) => flag.name))
        ),
      };
      return res.status(200).json(config);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
    return;
  } else if (req.method === "PUT") {
    try {
      const configSchemaResult = abbyConfigSchema.safeParse(req.body);
      if (!configSchemaResult.success) {
        res.status(400).end();
        return;
      }

      const userId = apiKeyEntry.userId;

      const newConfig = configSchemaResult.data;

      if (newConfig.tests) {
        Object.entries(newConfig.tests).forEach(async ([testName, test]) => {
          const testData = await prisma.test.findUnique({
            where: {
              projectId_name: {
                name: testName,
                projectId,
              },
            },
          });

          const variants: Array<string> = test["variants"];
          const weightedVariants = variants.map((variant) => ({
            name: variant,
            weight: 1 / variants.length,
          }));
          if (!testData) {
            await TestService.createTest(
              projectId,
              weightedVariants,
              testName,
              userId
            );
          }
        });
      }

      if (newConfig.flags) {
        const flagOperation = newConfig.flags.map(async (flag) => {
          const flagData = await prisma.featureFlag.findUnique({
            where: {
              projectId_name: {
                name: flag,
                projectId,
              },
            },
          });
          if (!flagData) {
            await FlagService.createFlag(projectId, flag, userId);
          }
          return flagData;
        });
        const flags = await Promise.all(flagOperation);
      }

      return res.status(200).json({ message: "Config updated" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error });
    }
    // return res.status(200).json({ message: "Hello world" });
  } else {
    res.setHeader("Allow", ["GET", "PUT"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
