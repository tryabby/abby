import { AbbyEventType } from "@tryabby/core";
import { Limit } from "server/common/plans";
import { EventService, EventServiceInterface } from "./EventService";
import { clickhouseClient } from "server/db/clickhouseClient";

export abstract class ClickHouseEventService implements EventServiceInterface {
  async createEvent(event: {
    type: AbbyEventType;
    projectId: string;
    testName: string;
    selectedVariant: string;
  }) {
    const insertedEvent = await clickhouseClient.insert({
      table: "events",
      values: {
        type: event.type,
        projectId: event.projectId,
        testName: event.testName,
        selectedVariant: event.selectedVariant,
      },
    });

    return event;
  }
  async getEventsByProjectId(projectId: string) {
    const res = await clickhouseClient.query({
      query: `SELECT * FROM events WHERE projectId = '${projectId}'`,
    });

    const resultData = await res.json().then((data) => data);

    return resultData as any[];
  }
  getEventsByTestId(testId: string, timeInterval: string) {
    throw new Error("Method not implemented.");
  }
  getEventsForCurrentPeriod(projectId: string): Promise<{
    events: number;
    planLimits: Limit;
    plan:
      | "STARTUP"
      | "PRO"
      | "ENTERPRISE"
      | "BETA"
      | "STARTUP_LIFETIME"
      | undefined;
    is80PercentOfLimit: boolean;
  }> {
    throw new Error("Method not implemented.");
  }
}
