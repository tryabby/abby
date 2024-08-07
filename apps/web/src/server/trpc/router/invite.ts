import { TRPCError } from "@trpc/server";
import { prisma } from "server/db/client";
import { InviteService } from "server/services/InviteService";
import { updateProjectsOnSession } from "utils/updateSession";
import { z } from "zod";
import { sendInviteEmail } from "../../../../emails";
import { protectedProcedure, router } from "../trpc";

export const inviteRouter = router({
  getInviteData: protectedProcedure
    .input(z.object({ inviteId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.projectInvite.findUnique({
        where: {
          id: input.inviteId,
        },
        include: {
          project: true,
        },
      });
    }),
  createInvite: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        email: z.string().email(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const currentProject = await ctx.prisma.project.findFirst({
        where: {
          id: input.projectId,
          users: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
        include: {
          users: { include: { user: true } },
        },
      });

      if (!currentProject) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      if (
        input.email === ctx.session.user.email ||
        currentProject.users.some((user) => user.user.email === input.email)
      ) {
        throw new TRPCError({ code: "CONFLICT" });
      }

      const userToInvite = await ctx.prisma.user.findFirst({
        where: {
          email: input.email,
        },
      });

      if (!userToInvite) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const invite = await prisma.projectInvite.create({
        data: {
          projectId: input.projectId,
          email: input.email,
          userId: userToInvite.id,
        },
      });

      if (!ctx.session.user.email) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      try {
        await sendInviteEmail({
          invitee: {
            name: userToInvite.name ?? undefined,
            email: input.email,
          },
          inviter: {
            name: ctx.session.user.name ?? ctx.session.user.email,
            email: ctx.session.user.email,
          },
          project: currentProject,
          inviteId: invite.id,
        });
        // we need to make sure the invite is deleted if the email fails to send
        // so that the user can try again
      } catch (e) {
        await prisma.projectInvite.delete({
          where: {
            id: invite.id,
          },
        });
        throw e;
      }

      return {
        inviteId: invite.id,
      };
    }),
  acceptInvite: protectedProcedure
    .input(z.object({ inviteId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const invite = await prisma.projectInvite.findUnique({
        where: {
          id: input.inviteId,
        },
      });

      if (!invite) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (invite.email !== ctx.session.user.email) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      await InviteService.acceptInvite(invite.id, ctx.session.user.id);

      // manually add the projectId to the token
      await updateProjectsOnSession(ctx, invite.projectId);

      return {
        projectId: invite.projectId,
      };
    }),
});
