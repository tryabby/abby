import { TRPCError } from "@trpc/server";
import { getProjectPaidPlan } from "lib/stripe";
import { ConfigCache } from "server/common/config-cache";
import { getLimitByPlan } from "server/common/plans";
import { prisma } from "server/db/client";

type Variant = {
  name: string;
  weight: number;
};

export abstract class TestService {
  static async createTest(
    projectId: string,
    variants: Array<Variant>,
    testName: string,
    userId: string
  ) {
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
        tests: true,
        environments: true,
      },
    });

    if (!project) throw new TRPCError({ code: "UNAUTHORIZED" });

    const limits = getLimitByPlan(getProjectPaidPlan(project));

    if (project.tests.length >= limits.tests) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `You have reached the limit of ${limits.tests} tests for your plan.`,
      });
    }

    project.environments.forEach((env) => {
      ConfigCache.deleteConfig({
        environment: env.name,
        projectId: env.projectId,
      });
    });

    return await prisma.test.create({
      data: {
        name: testName,
        projectId: projectId,
        options: {
          createMany: {
            data: variants.map((variant) => ({
              identifier: variant.name,
              chance: variant.weight,
            })),
          },
        },
      },
    });
  }
}
