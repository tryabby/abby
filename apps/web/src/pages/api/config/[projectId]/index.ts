import { Variants, useElementScroll } from "framer-motion";
import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "server/db/client";

import NextCors from "nextjs-cors";
import { z } from "zod";
import { FlagService } from "server/services/FlagService";
import { TestService } from "server/services/TestService";

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

      const newConfig = configSchemaResult.data;
      console.log(newConfig);

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

      if (newConfig.tests) {
        Object.entries(newConfig.tests).forEach(async ([testName, test]) => {
          console.log(testName, test);
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
              apiKey
            );

            await prisma.test.create({
              data: {
                name: testName,
                projectId,
                options: {
                  createMany: {
                    data: variants.map((variant) => ({
                      identifier: variant,
                      chance: 1 / variants.length,
                    })),
                  },
                },
              },
            });
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
            await FlagService.createFlag(projectId, flag, apiKey);
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
