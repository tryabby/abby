import type { AbbyEvent } from "@tryabby/core";
import dayjs from "dayjs";
import {
  TIME_INTERVAL,
  getMSFromSpecialTimeInterval,
  isSpecialTimeInterval,
} from "lib/events";
import ms from "ms";
import { PLANS, type PlanName, getLimitByPlan } from "server/common/plans";
import { prisma } from "server/db/client";
import { RequestCache } from "./RequestCache";

export abstract class EventService {
  static async createEvent({
    projectId,
    selectedVariant,
    testName,
    type,
  }: AbbyEvent) {
    return prisma.event.create({
      data: {
        selectedVariant,
        type,
        test: {
          connect: {
            projectId_name: {
              projectId,
              name: testName,
            },
          },
        },
      },
    });
  }

  static async getEventsByProjectId(projectId: string) {
    return prisma.event.findMany({
      where: {
        test: {
          projectId,
        },
      },
    });
  }

  static async getEventsByTestId(testId: string, timeInterval: string) {
    const now = new Date().getTime();

    if (isSpecialTimeInterval(timeInterval)) {
      const specialIntervalInMs = getMSFromSpecialTimeInterval(timeInterval);
      return prisma.event.findMany({
        where: {
          testId,
          ...(specialIntervalInMs !== Number.POSITIVE_INFINITY &&
            timeInterval !== TIME_INTERVAL.DAY && {
              createdAt: {
                gte: new Date(now - getMSFromSpecialTimeInterval(timeInterval)),
              },
            }),
          // Special case for day, since we want to include the current day
          ...(timeInterval === TIME_INTERVAL.DAY && {
            createdAt: {
              gte: dayjs().startOf("day").toDate(),
            },
          }),
        },
        orderBy: {
          createdAt: "asc",
        },
      });
    }

    const parsedInterval = ms(timeInterval) as number | undefined;

    if (parsedInterval === undefined) {
      throw new Error("Invalid time interval");
    }

    return prisma.event.findMany({
      where: {
        testId,
        createdAt: {
          gte: new Date(now - parsedInterval),
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  static async getEventsForCurrentPeriod(projectId: string) {
    const [project, eventCount] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        select: { stripePriceId: true },
      }),
      RequestCache.get(projectId),
    ]);

    if (!project) throw new Error("Project not found");

    const plan = Object.keys(PLANS).find(
      (plan) => PLANS[plan as PlanName] === project.stripePriceId
    ) as PlanName | undefined;

    const planLimits = getLimitByPlan(plan ?? null);

    return {
      events: eventCount,
      planLimits,
      plan,
      is80PercentOfLimit: planLimits.eventsPerMonth * 0.8 === eventCount,
    };
  }
}
