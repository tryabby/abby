import { Worker } from "bullmq";
import { ApiRequest, ApiVersion } from "@prisma/client";
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

export type AfterDataEventBatchArray = Omit<ApiRequest, "id" | "createdAt">[];

export const afterDataRequestWorkerFactory = (
  requestArray: AfterDataEventBatchArray
) => {
  const afterDataRequestWorker = new Worker<AfterRequestJobPayload>(
    afterDataRequestQueue.name,
    async ({ data: { apiVersion, functionDuration, projectId } }) => {
      requestArray.push({
        projectId,
        type: "GET_CONFIG",
        durationInMs: functionDuration,
        apiVersion,
      });
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

  afterDataRequestWorker.on("failed", (job) => {
    console.log(
      `[${afterDataRequestQueue.name}]: Job failed`,
      job?.id,
      job?.failedReason
    );
  });

  afterDataRequestWorker.on("error", (error) => {
    console.log(`[${afterDataRequestQueue.name}]: Error`, error);
  });

  return afterDataRequestWorker;
};
