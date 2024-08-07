import { FeatureFlagType } from "@prisma/client";
import type {
  AbbyConfigFile,
  PullAbbyConfigResponse,
  RemoteConfigValueString,
} from "@tryabby/core";
import {
  getDefaultFlagValue,
  stringifyFlagValue,
  transformClientFlagToDBType,
  transformDBFlagTypeToclient,
} from "lib/flags";
import { prisma } from "server/db/client";
import type { FlagValueString } from "types/flags";
import { FlagService } from "./FlagService";
import { TestService } from "./TestService";

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
    tests: projectData.tests.reduce(
      (acc, test) => {
        acc[test.name] = {
          variants: test.options.map((option) => option.identifier),
        };
        return acc;
      },
      {} as NonNullable<PullAbbyConfigResponse["tests"]>
    ),
    flags: projectData.featureFlags
      .filter((flag) => flag.type === FeatureFlagType.BOOLEAN)
      .map((flag) => flag.name),
    remoteConfig: projectData.featureFlags.reduce(
      (acc, flag) => {
        if (flag.type !== FeatureFlagType.BOOLEAN) {
          acc[flag.name] = transformDBFlagTypeToclient(flag.type) as Exclude<
            FlagValueString,
            "Boolean"
          >;
        }
        return acc;
      },
      {} as Record<string, RemoteConfigValueString>
    ),
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

        const variants: Array<string> = test.variants;
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

  const featureFlags = (config.flags ?? []).map((flag) => ({
    name: flag,
    type: "Boolean" as const,
  }));
  const remoteConfig = Object.entries(config.remoteConfig ?? {}).map(
    (config) => ({
      name: config[0],
      type: config[1],
    })
  );

  const flags = [...featureFlags, ...remoteConfig];

  await Promise.all(
    flags.map(async ({ name, type }) => {
      const flagValue = getDefaultFlagValue(type);
      const flagData = await prisma.featureFlag.findUnique({
        where: {
          projectId_name: {
            name,
            projectId,
          },
        },
      });

      if (flagData) {
        return;
      }

      return FlagService.createFlag({
        projectId,
        flagName: name,
        userId,
        type: transformClientFlagToDBType(type),
        value: stringifyFlagValue(flagValue),
      });
    })
  );
}
