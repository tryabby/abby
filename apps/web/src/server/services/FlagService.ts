import { FeatureFlagType, Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { getFlagCount } from "lib/flags";
import { getProjectPaidPlan } from "lib/stripe";
import { getLimitByPlan } from "server/common/plans";
import { prisma } from "server/db/client";
import { validateFlag } from "utils/validateFlags";

export abstract class FlagService {
  static async createFlag({
    projectId,
    flagName,
    userId,
    type,
    value,
  }: {
    projectId: string;
    flagName: string;
    userId: string;
    type: FeatureFlagType;
    value: string;
  }) {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        users: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        featureFlags: true,
      },
    });

    if (!project) throw new TRPCError({ code: "UNAUTHORIZED" });

    const limits = getLimitByPlan(getProjectPaidPlan(project));

    if (getFlagCount(project.featureFlags) >= limits.flags) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `You have reached the limit of ${limits.flags} flags for your plan.`,
      });
    }

    if (!validateFlag(type, value)) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `The value ${value} is not valid for the type ${type}`,
      });
    }

    const projectEnvs = await prisma.environment.findMany({
      where: {
        projectId: projectId,
      },
    });

    return await prisma.$transaction(async (tx) => {
      const newFlag = await tx.featureFlag.create({
        data: {
          name: flagName,
          projectId: projectId,
          type,
        },
      });

      const featureFlagValues = await Promise.all(
        projectEnvs.map((env) =>
          tx.featureFlagValue.create({
            data: {
              environmentId: env.id,
              flagId: newFlag.id,
              value,
            },
          })
        )
      );

      return tx.featureFlagHistory.createMany({
        data: featureFlagValues.map((featureFlag) => ({
          userId: userId,
          flagValueId: featureFlag.id,
          newValue: value,
        })) satisfies Prisma.FeatureFlagHistoryCreateManyInput[],
      });
    });
  }
}
