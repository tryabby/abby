import { prisma } from "server/db/client";

export abstract class InviteService {
  static async acceptInvite(inviteId: string, userId: string) {
    const invite = await prisma.projectInvite.findUnique({
      where: {
        id: inviteId,
      },
    });

    if (!invite) {
      throw new Error("Invite not found");
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (invite.email !== user.email) {
      throw new Error("User not invited");
    }

    await prisma.projectUser.create({
      data: {
        projectId: invite.projectId,
        userId: userId,
      },
    });

    await prisma.projectInvite.delete({
      where: {
        id: inviteId,
      },
    });
  }

  static async getEventsByProjectId(projectId: string) {
    return prisma.event.findMany({
      where: {
        test: {
          projectId,
        },
      },
    });
  }
}
