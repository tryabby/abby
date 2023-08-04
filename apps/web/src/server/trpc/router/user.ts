import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const updateProfileSchema = z.object({
  name: z.string().min(1),
});

export const userRouter = router({
  getUserData: protectedProcedure.query(async ({ ctx }) => {
    return {
      user: ctx.session.user.id,
      projects: await ctx.prisma.project.findMany({
        where: {
          users: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
        include: {
          tests: true,
        },
      }),
    };
  }),
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.user.findUnique({
      where: {
        id: ctx.session.user.id,
      },
      include: {
        accounts: true,
      },
    });
  }),
  getProjects: protectedProcedure.query(async ({ ctx }) => {
    return {
      user: ctx.session.user.id,
      projects: await ctx.prisma.projectUser.findMany({
        where: {
          userId: ctx.session.user.id,
        },
        include: {
          project: true,
        },
      }),
    };
  }),
  getApiKeyData: protectedProcedure.query(async ({ ctx }) => {
    return {
      userId: ctx.session.user.id,
      apiKeys: await ctx.prisma.apiKey.findMany({
        where: {
          userId: ctx.session.user.id,
          revokedAt: null,
        },
      }),
    };
  }),
  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: {
          id: ctx.session.user.id,
        },
        data: {
          name: input.name,
        },
      });
    }),
});
