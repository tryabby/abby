import { z } from "zod"
import { router, protectedProcedure } from "../trpc"
import { prisma } from "server/db/client"

export const projectUserRouter = router({
  addUser: protectedProcedure
    .input(z.object({ projectId: z.string(), userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await prisma.projectUser.create({
        data: {
          projectId: input.projectId,
          userId: ctx.session.user.id,
        },
      })
    }),
})
