import {
  getEventsByTestIdForAllTime,
  getEventsByTestIdForDay,
  getEventsByTestIdForLast30Days,
} from "@prisma/client/sql";
import type { AbbyEvent, AbbyEventType } from "@tryabby/core";
import { TIME_INTERVAL, isSpecialTimeInterval } from "lib/events";
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

  static async getEventsByTestId(
    testId: string,
    timeInterval: string,
    eventType: AbbyEventType
    // all function should have the same type
  ): Promise<getEventsByTestIdForDay.Result[]> {
    if (isSpecialTimeInterval(timeInterval)) {
      if (timeInterval === TIME_INTERVAL.DAY) {
        return await prisma.$queryRawTyped(
          getEventsByTestIdForDay(testId, eventType)
        );
      }
      if (timeInterval === TIME_INTERVAL.LAST_30_DAYS) {
        return await prisma.$queryRawTyped(
          getEventsByTestIdForLast30Days(testId, eventType)
        );
      }
    }

    return await prisma.$queryRawTyped(
      getEventsByTestIdForAllTime(testId, eventType, testId, eventType)
    );
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
