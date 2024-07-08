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
import { z } from "zod";

const GroupedTestQueryResultSchema = z.object({
  selectedVariant: z.string(),
  type: z.number(),
  count: z.string(),
});

type GroupedTestQueryResult = z.infer<typeof GroupedTestQueryResultSchema>;

export abstract class ClickHouseEventService {
  static async createEvent({
    projectId,
    selectedVariant,
    testName,
    type,
  }: AbbyEvent) {
    const insertedEvent = await clickhouseClient.insert({
      table: "abby.Event",
      format: "JSONEachRow",
      values: [
        {
          project_id: projectId,
          testName: testName,
          type,
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
      query: `SELECT * FROM abby.events WHERE projectId = '${projectId}'`,
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
    const parsedJson = (await queryResult.json()).data;

    return parsedJson.map((row) => {
      const { count, selectedVariant, type } =
        GroupedTestQueryResultSchema.parse(row);
      return {
        variant: selectedVariant,
        type: type === 0 ? AbbyEventType.PING : AbbyEventType.ACT,
        count: parseInt(count),
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
