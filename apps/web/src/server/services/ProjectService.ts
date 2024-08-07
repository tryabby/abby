import { env } from "node:process";
import { ROLE } from "@prisma/client";
import { BETA_PRICE_ID } from "lib/stripe";
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
