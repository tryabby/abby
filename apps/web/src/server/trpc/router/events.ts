import { TRPCError } from "@trpc/server";
import { ProjectService } from "server/services/ProjectService";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { ClickHouseEventService } from "server/services/ClickHouseEventService";
import { SpecialTimeInterval } from "lib/events";

export const eventRouter = router({
  getEvents: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const hasAccess = await ProjectService.hasProjectAccess(
        input.projectId,
        ctx.session.user.id
      );

      if (!hasAccess) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      return EventService.getEventsByProjectId(input.projectId);
    }),
  getEventsByTestId: protectedProcedure
    .input(
      z.object({
        testId: z.string(),
        interval: z.nativeEnum(SpecialTimeInterval),
      })
    )
    .query(async ({ ctx, input }) => {
      const currentTest = await ctx.prisma.test.count({
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
      });

      if (!currentTest) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const clickhouseEvents = await ClickHouseEventService.getEventsByTestId(
        input.testId,
        input.interval
      );

      return clickhouseEvents;
    }),
});
