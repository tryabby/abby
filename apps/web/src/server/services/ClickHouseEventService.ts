import dayjs from "dayjs";
import {
  getMSFromSpecialTimeInterval,
  isSpecialTimeInterval,
  SpecialTimeInterval,
} from "lib/events";
import ms from "ms";
import { getLimitByPlan, Limit, PlanName, PLANS } from "server/common/plans";
import { prisma } from "server/db/client";
import { AbbyEvent, AbbyEventType } from "@tryabby/core";
import { RequestCache } from "./RequestCache";
import { clickhouseClient } from "server/db/clickhouseClient";

export abstract class ClickHouseEventService {
  static async createEvent(event: {
    type: AbbyEventType;
    projectId: string;
    testName: string;
    selectedVariant: string;
  }) {
    const insertedEvent = await clickhouseClient.insert({
      table: "abby.events",
      format: "JSONEachRow",
      values: [
        {
          type: event.type,
          projectId: event.projectId,
          testName: event.testName,
          selectedVariant: event.selectedVariant,
        },
      ],
    });

    return insertedEvent;
  }

  static async getEventsByProjectId(projectId: string): Promise<
    {
      id: string;
      testId: string;
      type: number;
      selectedVariant: string;
      createdAt: Date;
    }[]
  > {
    const queryResult = await clickhouseClient.query({
      query: `SELECT * FROM abby.events WHERE projectId = '${"clvh4sv5n0001furg6tj08z63"}'`,
    });

    return (await queryResult.json()).data as any;
  }

  static async getEventsByTestId(testId: string, timeInterval: string) {
    const now = new Date().getTime();

    if (isSpecialTimeInterval(timeInterval)) {
      const specialIntervalInMs = getMSFromSpecialTimeInterval(timeInterval);
      return prisma.event.findMany({
        where: {
          testId,
          ...(specialIntervalInMs !== Infinity &&
            timeInterval !== SpecialTimeInterval.DAY && {
              createdAt: {
                gte: new Date(now - getMSFromSpecialTimeInterval(timeInterval)),
              },
            }),
          // Special case for day, since we want to include the current day
          ...(timeInterval === SpecialTimeInterval.DAY && {
            createdAt: {
              gte: dayjs().startOf("day").toDate(),
            },
          }),
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
          gte: new Date(now - ms(timeInterval)),
        },
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
