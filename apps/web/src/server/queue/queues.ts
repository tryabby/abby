import { Queue } from "bullmq";
import type { AfterRequestJobPayload } from "./AfterDataRequest";
import type { EventJobPayload } from "./event";
import { Redis } from "ioredis";
import { env } from "env/server.mjs";

// enforce the queue names to be in the format {name}
// https://docs.bullmq.io/guide/redis-tm-compatibility/dragonfly
const QUEUE_NAMES = {
  events: "{events}",
  afterDataRequestQueue: "{afterDataRequestQueue}",
} satisfies Record<string, `{${string}}`>;

export const getQueueingRedisConnection = () =>
  new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

export const eventQueue = new Queue<EventJobPayload>(QUEUE_NAMES.events, {
  connection: getQueueingRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
});

export const afterDataRequestQueue = new Queue<AfterRequestJobPayload>(
  QUEUE_NAMES.afterDataRequestQueue,
  {
    connection: getQueueingRedisConnection(),
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
