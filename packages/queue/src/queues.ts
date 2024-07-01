import { AbbyEvent } from "@tryabby/core";
import { connection } from "./connection";
import { Queue } from "bullmq";
import { ApiVersion } from "@tryabby/db";

// enforce the queue names to be in the format {name}
// https://docs.bullmq.io/guide/redis-tm-compatibility/dragonfly
const QUEUE_NAMES = {
  events: "{events}",
  afterDataRequestQueue: "{afterDataRequestQueue}",
} satisfies Record<string, `{${string}}`>;

export type EventJobPayload = AbbyEvent & {
  functionDuration: number;
};

export const eventQueue = new Queue<EventJobPayload>(QUEUE_NAMES.events, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
});

export type AfterRequestJobPayload = {
  functionDuration: number;
  projectId: string;
  apiVersion: ApiVersion;
};

export const afterDataRequestQueue = new Queue<AfterRequestJobPayload>(
  QUEUE_NAMES.afterDataRequestQueue,
  {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
    },
  }
);

[afterDataRequestQueue, eventQueue].forEach((queue) => {
  queue.on("error", (error) => {
    console.error(`[${queue.name}]: Error`, error);
  });
});
