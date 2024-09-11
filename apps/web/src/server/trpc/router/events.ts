import { TRPCError } from "@trpc/server";
import { groupBy, uniqBy } from "lodash-es";
import { EventService } from "server/services/EventService";
import { ProjectService } from "server/services/ProjectService";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc";
import { AbbyEventType } from "@tryabby/core";
import dayjs from "dayjs";
import { getBaseEventsByInterval, TIME_INTERVAL } from "lib/events";
import memoize from "memoize";
import type { Context } from "../context";

export const getEventData = memoize(
  async (testId: string, interval: string, potentialVariants: string[]) => {
    const [_actEvents, _pingEvents] = await Promise.all([
      EventService.getEventsByTestId(testId, interval, AbbyEventType.ACT),
      EventService.getEventsByTestId(testId, interval, AbbyEventType.PING),
    ]);

    const baseActEvents =
      getBaseEventsByInterval(
        interval,
        potentialVariants,
        _actEvents[0]?.createdAt ?? new Date()
      ) ?? [];

    const basePingEvents =
      getBaseEventsByInterval(
        interval,
        potentialVariants,
        _actEvents[0]?.createdAt ?? new Date()
      ) ?? [];

    const actEventsByDate = groupBy(_actEvents, (e) => {
      const date = dayjs(e.createdAt);
      if (interval === TIME_INTERVAL.DAY) {
        // round by 3 hours
        const hour = Math.floor(date.hour() / 3) * 3;

        return date
          .set("hour", hour)
          .set("minute", 0)
          .set("second", 0)
          .set("millisecond", 0)
          .toISOString();
      }
      return date.startOf("day").toISOString();
    });

    const pingEventsByDate = groupBy(_pingEvents, (e) => {
      const date = dayjs(e.createdAt);
      if (interval === TIME_INTERVAL.DAY) {
        // round by 3 hours
        const hour = Math.floor(date.hour() / 3) * 3;

        return date
          .set("hour", hour)
          .set("minute", 0)
          .set("second", 0)
          .set("millisecond", 0)
          .toISOString();
      }
      return date.startOf("day").toISOString();
    });

    const pingEvents = uniqBy(
      [
        ...Object.entries(pingEventsByDate).map(([date, events]) => {
          const tests = groupBy(events, (e) => e.selectedVariant);

          const testCount = Object.entries(tests).reduce(
            (acc, [variant, events]) => {
              acc[variant] = {
                totalEventCount: events.reduce(
                  (acc, e) => acc + Number(e.eventCount),
                  0
                ),
                uniqueEventCount: events.reduce(
                  (acc, e) => acc + Number(e.uniqueEventCount),
                  0
                ),
              };
              return acc;
            },
            {} as Record<
              string,
              {
                totalEventCount: number;
                uniqueEventCount: number;
              }
            >
          );
          potentialVariants.forEach((variant) => {
            if (!testCount[variant]) {
              testCount[variant] = {
                totalEventCount: 0,
                uniqueEventCount: 0,
              };
            }
          });
          return { date, ...testCount } as {
            date: string;
            [key: string]: number | string;
          };
        }),
        ...basePingEvents,
      ].toSorted((a, b) => (dayjs(a.date).isBefore(dayjs(b.date)) ? -1 : 1)),
      (e) => e.date
    ) as Array<{
      date: string;
      [key: string]:
        | {
            totalEventCount: number;
            uniqueEventCount: number;
          }
        | string;
    }>;

    const actEvents = uniqBy(
      [
        ...Object.entries(actEventsByDate).map(([date, events]) => {
          const tests = groupBy(events, (e) => e.selectedVariant);
          const testCount = Object.entries(tests).reduce(
            (acc, [variant, events]) => {
              acc[variant] = {
                totalEventCount: events.reduce(
                  (acc, e) => acc + Number(e.eventCount),
                  0
                ),
                uniqueEventCount: events.reduce(
                  (acc, e) => acc + Number(e.uniqueEventCount),
                  0
                ),
              };
              return acc;
            },
            {} as Record<
              string,
              {
                totalEventCount: number;
                uniqueEventCount: number;
              }
            >
          );
          potentialVariants.forEach((variant) => {
            if (!testCount[variant]) {
              testCount[variant] = {
                totalEventCount: 0,
                uniqueEventCount: 0,
              };
            }
          });
          return { date, ...testCount } as {
            date: string;
            [key: string]:
              | {
                  totalEventCount: number;
                  uniqueEventCount: number;
                }
              | string;
          };
        }),
        ...baseActEvents,
      ].toSorted((a, b) => (dayjs(a.date).isBefore(dayjs(b.date)) ? -1 : 1)),
      (e) => e.date
    ) as Array<{
      [key: string]:
        | {
            totalEventCount: number;
            uniqueEventCount: number;
          }
        | string;
    }>;

    const totalPingEvents = pingEvents.map((e) => {
      return {
        date: e.date,
        ...Object.entries(e).reduce(
          (acc, [key, value]) => {
            if (key === "date") return acc;
            if (typeof value === "string") {
              acc[key] = 0;
              return acc;
            }

            acc[key] = value.totalEventCount;
            return acc;
          },
          {} as {
            [key: string]: number | string;
          }
        ),
      } as {
        date: string;
        [key: string]: string;
      };
    });

    const uniquePingEvents = pingEvents.map((e) => {
      return {
        date: e.date,
        ...Object.entries(e).reduce(
          (acc, [key, value]) => {
            if (key === "date") return acc;
            if (typeof value === "string") return acc;
            acc[key] = value.uniqueEventCount;
            return acc;
          },
          {} as {
            [key: string]: number | string;
          }
        ),
      } as {
        date: string;
        [key: string]: string;
      };
    });

    const totalActEvents = actEvents.map((e) => {
      return {
        date: e.date,
        ...Object.entries(e).reduce(
          (acc, [key, value]) => {
            if (key === "date") return acc;
            if (typeof value === "string") return acc;
            acc[key] = value.totalEventCount;
            return acc;
          },
          {} as {
            [key: string]: number | string;
          }
        ),
      } as {
        date: string;
        [key: string]: string;
      };
    });

    const uniqueActEvents = actEvents.map((e) => {
      return {
        date: e.date,
        ...Object.entries(e).reduce(
          (acc, [key, value]) => {
            if (key === "date") return acc;
            if (typeof value === "string") return acc;
            acc[key] = value.uniqueEventCount;
            return acc;
          },
          {} as {
            [key: string]: number | string;
          }
        ),
      } as {
        date: string;
        [key: string]: string;
      };
    });

    return {
      totalPingEvents,
      uniquePingEvents,
      totalActEvents,
      uniqueActEvents,
      potentialVariants,
    };
  },
  {
    maxAge: 1000 * 10,
    cacheKey: ([testId, interval, potentialVariants]) => {
      return `${testId}-${interval}-${potentialVariants.join("-")}`;
    },
  }
);

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

      const potentialVariants = currentTest.options.map((o) => o.identifier);

      return {
        currentTest,
        ...(await getEventData(
          input.testId,
          input.interval,
          potentialVariants
        )),
      };
    }),
  getEventCount: publicProcedure.query(async ({ ctx }) => {
    return await getTotalEventCount(ctx);
  }),
});

const getTotalEventCount = memoize(
  async (ctx: Context) => {
    const [eventCount, apiRequestCount] = await Promise.all([
      ctx.prisma.event.count(),
      ctx.prisma.apiRequest.count(),
    ]);
    return eventCount + apiRequestCount;
  },
  {
    maxAge: 1000 * 60,
  }
);
