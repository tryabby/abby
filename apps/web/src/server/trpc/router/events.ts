import { TRPCError } from "@trpc/server";
import { EventService } from "server/services/EventService";
import { ProjectService } from "server/services/ProjectService";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { ClickHouseEventService } from "server/services/ClickHouseEventService";

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
        interval: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      console.log("hier");

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
        console.log("erro");
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const tests = await EventService.getEventsByTestId(
        input.testId,
        input.interval
      );

      // console.log("clickhouse");
      // await ClickHouseEventService.getEventsByTestId(
      //   input.testId,
      //   input.interval
      // );
      console.log("lickhouse end");

      return tests;
    }),
});
