import { Worker } from "bullmq";
import { trackPlanOverage } from "lib/logsnag";
import { RequestCache } from "server/services/RequestCache";
import { RequestService } from "server/services/RequestService";
import { EventService } from "server/services/EventService";
import { eventQueue, getQueueingRedisConnection } from "./queues";
import { AbbyEvent, AbbyEventType } from "@tryabby/core";
import { env } from "env/server.mjs";
import { ApiRequestType } from "@prisma/client";
import { AfterDataEventBatchArray } from "./AfterDataRequest";

export type EventJobPayload = AbbyEvent & {
  functionDuration: number;
};

const EventTypeToRequestType = {
  [AbbyEventType.ACT]: "TRACK_CONVERSION",
  [AbbyEventType.PING]: "TRACK_VIEW",
} satisfies Record<AbbyEventType, ApiRequestType>;

export default function eventWorkerFactory(
  eventBatchArray: EventJobPayload[],
  afterDataRequestBatchArray: AfterDataEventBatchArray
) {
  const eventWorker = new Worker<EventJobPayload>(
    eventQueue.name,
    async ({ data: event }) => {
      // TODO: add those to a queue and process them in a background job as they are not critical
      switch (event.type) {
        case AbbyEventType.PING:
        case AbbyEventType.ACT: {
          eventBatchArray.push(event);
          afterDataRequestBatchArray.push({
            projectId: event.projectId,
            type: EventTypeToRequestType[event.type],
            durationInMs: event.functionDuration,
            apiVersion: "V1",
          });
          break;
        }
        default: {
          event.type satisfies never;
        }
      }
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
  return eventWorker;
}
