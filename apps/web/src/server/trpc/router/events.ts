import { TRPCError } from "@trpc/server";
import { EventService } from "server/services/EventService";
import { ProjectService } from "server/services/ProjectService";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const eventRouter = router({
  getEventsByTestId: protectedProcedure
    .input(
      z.object({
        testId: z.string(),
        interval: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const currentTest = await ctx.prisma.test.findFirst({
        where: {
          id: input.testId,
          project: {
            users: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
        },
        include: { options: true },
      });

      if (!currentTest) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const events = await EventService.getEventsByTestId({
        testId: input.testId,
        timeInterval: input.interval,
        testVersion: currentTest.version,
      });

      return {
        events,
        testName: currentTest.name,
        variants: currentTest.options.map((option) => option.identifier),
      };
    }),
});
