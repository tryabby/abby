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
import { count } from "node:console";

export abstract class ClickHouseEventService {
  static async createEvent(
    { projectId, selectedVariant, testName, type }: AbbyEvent,
    id: string
  ) {
    console.log("clickhouse", id);
    const insertedEvent = await clickhouseClient.insert({
      table: "abby.Event",
      format: "JSONEachRow",
      values: [
        {
          id,
          project_id: projectId,
          testName: testName,
          type: 0,
          selectedVariant: selectedVariant,
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

  static async getGroupedEventsByTestId(
    test: {
      options: {
        id: string;
        identifier: string;
        testId: string;
      }[];
    } & {
      id: string;
      projectId: string;
      createdAt: Date;
      updatedAt: Date;
      name: string;
    }
  ) {
    const queryResult = await clickhouseClient.query({
      query: `select count(*) as count, type, selectedVariant from abby.Event 
      where testName ='${test.id}' 
      group by type, selectedVariant;
              `,
    });

    //TODO add validation with id
    const parsedRes = (await queryResult.json()).data as {
      selectedVariant: string;
      type: string;
      count: string;
    }[];

    return parsedRes.map((row) => {
      console.log(typeof row.count);
      return {
        variant: row.selectedVariant,
        type: parseInt(row.type) == 0 ? AbbyEventType.PING : AbbyEventType.ACT,
        count: parseInt(row.count),
      };
    });
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
