import { SpecialTimeInterval } from "lib/events";
import { getLimitByPlan, PlanName, PLANS } from "server/common/plans";
import { prisma } from "server/db/client";
import { AbbyEvent, AbbyEventType, assertUnreachable } from "@tryabby/core";
import { RequestCache } from "./RequestCache";
import { clickhouseClient } from "server/db/clickhouseClient";
import { z } from "zod";

const GroupedTestQueryResultSchema = z.object({
  selectedVariant: z.string(),
  type: z.number(),
  count: z.string(),
});

const GroupedTestQueryResultSchemaWithTimeSchema = z.intersection(
  GroupedTestQueryResultSchema,
  z.object({ startTime: z.string() })
);

type GroupedTestQueryResultSchemaWithTime = z.infer<
  typeof GroupedTestQueryResultSchemaWithTimeSchema
>;
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

  //brauchen wir das?
  static async getEventsByTestId(
    testId: string,
    timeInterval: SpecialTimeInterval
  ) {
    const computedBucketSize = this.computeBucketSize(timeInterval);

    try {
      const result = await clickhouseClient.query({
        query: `
        SELECT
        ${computedBucketSize} AS startTime,
        Count(selectedVariant) AS count, 
        selectedVariant,
        type
        FROM abby.Event
        WHERE testName = '${testId}'
        GROUP BY startTime, selectedVariant, type
        ORDER BY startTime ASC;
`,
      });

      const parsedJson = (await result.json()).data;
      console.log(parsedJson);
      const parsedRes = parsedJson.map((row) => {
        const { count, selectedVariant, type, startTime } =
          GroupedTestQueryResultSchemaWithTimeSchema.parse(row);
        return {
          startTime: new Date(startTime),
          selectedVariant,
          type: type === 0 ? AbbyEventType.PING : AbbyEventType.ACT,
          count: parseInt(count),
        };
      });

      return parsedRes;
    } catch (e) {
      console.log("error", e);
    }
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

  static computeBucketSize(timeInterval: SpecialTimeInterval) {
    switch (timeInterval) {
      case SpecialTimeInterval.DAY: {
        return "toStartOfHour(createdAt)";
      }
      case SpecialTimeInterval.ALL_TIME:
      case SpecialTimeInterval.Last30DAYS: {
        return "toStartOfDay(createdAt)";
      }
      default:
        return assertUnreachable(timeInterval);
    }
  }
}
