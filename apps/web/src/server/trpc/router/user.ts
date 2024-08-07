import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

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
  onboardUser: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        profession: z.string(),
        technologies: z.array(z.string()),
        experienceLevelFlags: z.number().min(1).max(5),
        experienceLevelTests: z.number().min(1).max(5),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      await ctx.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          name: input.name,
          profession: input.profession,
          technologies: input.technologies,
          experienceLevelFlags: input.experienceLevelFlags,
          experienceLevelTests: input.experienceLevelTests,
          hasCompletedOnboarding: true,
        },
      });
    }),
});
