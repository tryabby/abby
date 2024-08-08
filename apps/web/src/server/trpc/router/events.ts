import { TRPCError } from "@trpc/server";
import { AbbyEventType } from "@tryabby/core";
import dayjs from "dayjs";
import { TIME_INTERVAL, getBaseEventsByInterval } from "lib/events";
import { groupBy, uniqBy } from "lodash-es";
import { EventService } from "server/services/EventService";
import { ProjectService } from "server/services/ProjectService";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

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
        include: {
          options: true,
        },
      });

      if (!currentTest) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const events = await EventService.getEventsByTestId(
        input.testId,
        input.interval
      );

      const potentialVariants = currentTest.options.map((o) => o.identifier);

      const eventsByDate = groupBy(events, (e) => {
        const date = dayjs(e.createdAt);
        if (input.interval === TIME_INTERVAL.DAY) {
          // round by 3 hours
          const hour = Math.floor(date.hour() / 3) * 3;

          return date.set("hour", hour).set("minute", 0).toISOString();
        }
        return date.startOf("day").toISOString();
      });

      const baseEvents =
        getBaseEventsByInterval(
          input.interval,
          potentialVariants,
          events[0]?.createdAt ?? new Date()
        ) ?? [];

      console.dir(baseEvents, { depth: null });

      const pingEvents = uniqBy(
        [
          ...Object.entries(eventsByDate).map(([date, events]) => {
            const tests = groupBy(
              events.filter((e) => e.type === AbbyEventType.PING),
              (e) => e.selectedVariant
            );
            const testCount = Object.entries(tests).reduce(
              (acc, [variant, events]) => {
                acc[variant] = events.length;
                return acc;
              },
              {} as Record<string, number>
            );
            potentialVariants.forEach((variant) => {
              if (!testCount[variant]) {
                testCount[variant] = 0;
              }
            });
            return { date, ...testCount } as {
              date: string;
              [key: string]: number | string;
            };
          }),
          ...baseEvents,
        ],
        (e) => e.date
      ) as Array<{
        date: string;
        [key: string]: string;
      }>;

      const actEvents = uniqBy(
        [
          ...Object.entries(eventsByDate).map(([date, events]) => {
            const tests = groupBy(
              events.filter((e) => e.type === AbbyEventType.ACT),
              (e) => e.selectedVariant
            );
            const testCount = Object.entries(tests).reduce(
              (acc, [variant, events]) => {
                acc[variant] = events.length;
                return acc;
              },
              {} as Record<string, number>
            );
            potentialVariants.forEach((variant) => {
              if (!testCount[variant]) {
                testCount[variant] = 0;
              }
            });
            return { date, ...testCount };
          }),
          ...baseEvents,
        ],
        (e) => e.date
      ) as Array<{
        date: string;
        [key: string]: string;
      }>;

      return { currentTest, pingEvents, actEvents, potentialVariants };
    }),
});
