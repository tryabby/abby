import { router, protectedProcedure } from "../trpc";

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
      user: ctx.session.user.id,
      apiKeys: await ctx.prisma.aPIKey.findMany({
        where: {
          userId: ctx.session.user.id,
          isRevoked: false,
        },
      }),
    };
  }),
});
