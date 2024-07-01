import { ROLE } from "@tryabby/db";
import { BETA_PRICE_ID } from "lib/stripe";
import { env } from "process";
import { prisma } from "server/db/client";

export abstract class ProjectService {
  static async hasProjectAccess(projectId: string, userId: string) {
    return (
      (await prisma.projectUser.count({
        where: {
          projectId: projectId,
          userId: userId,
        },
      })) > 0
    );
  }
  static async createProject(input: { projectName: string; userId: string }) {
    return prisma.project.create({
      data: {
        name: input.projectName,
        stripePriceId: env.NODE_ENV === "development" ? BETA_PRICE_ID : null,
        users: {
          create: {
            userId: input.userId,
            role: ROLE.ADMIN,
          },
        },
      },
    });
  }
}
