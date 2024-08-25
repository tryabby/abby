import { TRPCError } from "@trpc/server";
import { prisma } from "server/db/client";

export async function assertUserHasAcessToProject(
  projectId: string,
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
  });
  if (!project) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return project;
}
