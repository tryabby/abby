import { prisma } from "server/db/client";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const projectUserRouter = router({
  addUser: protectedProcedure
    .input(z.object({ projectId: z.string(), userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await prisma.projectUser.create({
        data: {
          projectId: input.projectId,
          userId: ctx.session.user.id,
        },
      });
    }),
});
