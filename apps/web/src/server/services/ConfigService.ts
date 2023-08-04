import {
  AbbyConfigFile,
  PullAbbyConfigResponse,
  getDefaultFlagValue,
  stringifyFlagValue,
} from "@tryabby/core";
import {
  transformClientFlagToDBType,
  transformDBFlagTypeToclient,
} from "lib/flags";
import { prisma } from "server/db/client";
import { TestService } from "./TestService";
import { FlagService } from "./FlagService";

export async function handleGET({ projectId }: { projectId: string }) {
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

  return config;
}

export async function handlePUT({
  config,
  projectId,
  userId,
}: {
  userId: string;
  projectId: string;
  config: AbbyConfigFile;
}) {
  // create all missing environments
  if (config.environments) {
    const currentEnvironments = await prisma.environment.findMany({
      where: {
        projectId,
      },
    });

    const missingEnvironments = config.environments.filter(
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

  if (config.tests) {
    await Promise.all(
      Object.entries(config.tests).map(async ([testName, test]) => {
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

        if (testData) {
          return;
        }

        return TestService.createTest(
          projectId,
          weightedVariants,
          testName,
          userId
        );
      })
    );
  }

  if (config.flags) {
    await Promise.all(
      Object.entries(config.flags).map(async ([flagName, flagTypeAsString]) => {
        const flagValue = getDefaultFlagValue(flagTypeAsString);
        const flagData = await prisma.featureFlag.findUnique({
          where: {
            projectId_name: {
              name: flagName,
              projectId,
            },
          },
        });

        if (flagData) {
          return;
        }

        return FlagService.createFlag({
          projectId,
          flagName,
          userId,
          type: transformClientFlagToDBType(flagTypeAsString),
          value: stringifyFlagValue(flagValue),
        });
      })
    );
  }
}
