import { Worker } from "bullmq";
import { ApiVersion } from "@prisma/client";
import { trackPlanOverage } from "lib/logsnag";
import { RequestCache } from "server/services/RequestCache";
import { RequestService } from "server/services/RequestService";
import { EventService } from "server/services/EventService";
import { afterDataRequestQueue, getQueueingRedisConnection } from "./queues";
import { env } from "env/server.mjs";

export type AfterRequestJobPayload = {
  functionDuration: number;
  projectId: string;
  apiVersion: ApiVersion;
};

export const afterDataRequestWorker = new Worker<AfterRequestJobPayload>(
  afterDataRequestQueue.name,
  async ({ data: { apiVersion, functionDuration, projectId } }) => {
    const { events, planLimits, plan, is80PercentOfLimit } =
      await EventService.getEventsForCurrentPeriod(projectId);

    if (events > planLimits.eventsPerMonth) {
      // TODO: send email
      // TODO: send email if 80% of limit reached
      await trackPlanOverage(projectId, plan);
    } else if (is80PercentOfLimit) {
      await trackPlanOverage(projectId, plan, is80PercentOfLimit);
    }

    await Promise.all([
      RequestCache.increment(projectId),
      RequestService.storeRequest({
        projectId,
        type: "GET_CONFIG",
        durationInMs: functionDuration,
        apiVersion,
      }),
    ]);
  },
  {
    connection: getQueueingRedisConnection(),
    concurrency: 50,
    removeOnComplete: { count: 100 },
  }
);

afterDataRequestWorker.on("ready", () => {
  console.log(`[${afterDataRequestQueue.name}]: Worker is ready`);
});

afterDataRequestWorker.on("completed", (job) => {
  if (env.NODE_ENV === "development") {
    console.log(`[${afterDataRequestQueue.name}]: Job completed`, job.id);
  }
});
