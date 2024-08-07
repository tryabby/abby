import { TRPCError } from "@trpc/server";
import dayjs from "dayjs";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const couponRouter = router({
  redeemCode: protectedProcedure
    .input(
      z.object({
        code: z.string(),
        projectId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const project = await ctx.prisma.project.findUnique({
        where: {
          id: input.projectId,
        },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const code = await ctx.prisma.couponCodes.findUnique({
        where: {
          code: input.code,
        },
      });

      if (!code || code.redeemedAt !== null) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await ctx.prisma.$transaction([
        ctx.prisma.project.update({
          where: {
            id: input.projectId,
          },
          data: {
            stripePriceId: code.stripePriceId,
            currentPeriodEnd: dayjs().toDate(),
          },
        }),
        ctx.prisma.couponCodes.update({
          where: {
            code: input.code,
          },
          data: {
            redeemedAt: new Date(),
            redeemedById: ctx.session.user.id,
          },
        }),
      ]);
    }),
});
