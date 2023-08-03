import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "server/db/client";
import NextCors from "nextjs-cors";
import { z } from "zod";
import { FlagService } from "server/services/FlagService";
import { TestService } from "server/services/TestService";
import { hashApiKey } from "utils/apiKey";
import {
  abbyConfigSchema,
  getDefaultFlagValue,
  stringifyFlagValue,
  type PullAbbyConfigResponse,
} from "@tryabby/core";
import {
  transformClientFlagToDBType,
  transformDBFlagTypeToclient,
} from "lib/flags";

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
    allowedHeaders: ["Authorization"],
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

  if (!apiKeyEntry || apiKeyEntry.isRevoked) {
    res.status(401).json({ error: "API key revoked" });
    return;
  }
  if (apiKeyEntry.validDays) {
    if (apiKeyEntry.validDays !== -1) {
      const now = new Date();
      const validUntil = new Date(apiKeyEntry.createdAt);
      validUntil.setDate(validUntil.getDate() + apiKeyEntry.validDays);

      if (now > validUntil) {
        res.status(401).json({ error: "API key expired" });
        return;
      }
    }
  } else {
    res.status(500).json({ error: "API key has no expiration date" });
  }

  if (req.method === "GET") {
    // TODO add event service ?
    try {
      const projectData = await prisma.project.findUnique({
        where: {
          id: projectId,
        },
        include: {
          environments: true,
          tests: {
            include: {
              options: true,
            },
          },
          featureFlags: true,
        },
      });

      if (!projectData) throw new Error("Cant find project");

      const config = {
        environments: projectData.environments.map(
          (environment) => environment.name
        ),
        tests: projectData.tests.reduce((acc, test) => {
          acc[test.name] = {
            variants: test.options.map((option) => option.identifier),
          };
          return acc;
        }, {} as Record<string, any>),
        flags: projectData.featureFlags.reduce((acc, flag) => {
          acc[flag.name] = transformDBFlagTypeToclient(flag.type);
          return acc;
        }, {} as Record<string, any>),
      } satisfies PullAbbyConfigResponse;

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

      // create all missing environments
      if (newConfig.environments) {
        const currentEnvironments = await prisma.environment.findMany({
          where: {
            projectId,
          },
        });

        const missingEnvironments = newConfig.environments.filter(
          (env) =>
            !currentEnvironments.find((currentEnv) => currentEnv.name === env)
        );

        await prisma.environment.createMany({
          data: missingEnvironments.map((envName) => ({
            name: envName,
            projectId,
          })),
        });
      }

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
        const flagOperation = Object.entries(newConfig.flags).map(
          async ([flagName, flagTypeAsString]) => {
            const flagValue = getDefaultFlagValue(flagTypeAsString);
            const flagData = await prisma.featureFlag.findUnique({
              where: {
                projectId_name: {
                  name: flagName,
                  projectId,
                },
              },
            });

            if (!flagData) {
              await FlagService.createFlag({
                projectId,
                flagName,
                userId,
                type: transformClientFlagToDBType(flagTypeAsString),
                value: stringifyFlagValue(flagValue),
              });
            }
            return flagData;
          }
        );
        const flags = await Promise.all(flagOperation);
      }

      return res.status(200).json({ message: "Config updated" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error });
    }
  } else {
    res.setHeader("Allow", ["GET", "PUT"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
