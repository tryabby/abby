import type { ApiRequestType } from "@prisma/client";
import { type AbbyEvent, AbbyEventType } from "@tryabby/core";
import { Worker } from "bullmq";
import { env } from "env/server.mjs";
import { trackPlanOverage } from "lib/logsnag";
import { EventService } from "server/services/EventService";
import { RequestCache } from "server/services/RequestCache";
import { RequestService } from "server/services/RequestService";
import { eventQueue, getQueueingRedisConnection } from "./queues";

export type EventJobPayload = AbbyEvent & {
  functionDuration: number;
};

const EventTypeToRequestType = {
  [AbbyEventType.ACT]: "TRACK_CONVERSION",
  [AbbyEventType.PING]: "TRACK_VIEW",
} satisfies Record<AbbyEventType, ApiRequestType>;

const eventWorker = new Worker<EventJobPayload>(
  eventQueue.name,
  async ({ data: event }) => {
    // TODO: add those to a queue and process them in a background job as they are not critical
    switch (event.type) {
      case AbbyEventType.PING:
      case AbbyEventType.ACT: {
        await EventService.createEvent(event);
        break;
      }
      default: {
        event.type satisfies never;
      }
    }
    const { events, planLimits, plan, is80PercentOfLimit } =
      await EventService.getEventsForCurrentPeriod(event.projectId);

    if (events > planLimits.eventsPerMonth) {
      // TODO: send email
      // TODO: send email if 80% of limit reached
      await trackPlanOverage(event.projectId, plan);
    } else if (is80PercentOfLimit) {
      await trackPlanOverage(event.projectId, plan, is80PercentOfLimit);
    }

    await Promise.all([
      RequestCache.increment(event.projectId),
      RequestService.storeRequest({
        projectId: event.projectId,
        type: EventTypeToRequestType[event.type],
        durationInMs: event.functionDuration,
        apiVersion: "V1",
      }),
    ]);
  },
  {
    connection: getQueueingRedisConnection(),
    concurrency: 50,
    removeOnComplete: { count: 100 },
  }
);

eventWorker.on("ready", () => {
  console.log(`[${eventQueue.name}]: Worker is ready`);
});

eventWorker.on("completed", (job) => {
  if (env.NODE_ENV === "development") {
    console.log(`[${eventQueue.name}]: Job completed`, job.id);
  }
});

eventWorker.on("failed", (job) => {
  console.log(`[${eventQueue.name}]: Job failed`, job?.id, job?.failedReason);
});

eventWorker.on("error", (error) => {
  console.log(`[${eventWorker.name}]: Error`, error);
});

export default eventWorker;
