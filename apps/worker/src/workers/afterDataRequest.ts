import { Job } from "bullmq";
import { PrismaClient } from "@tryabby/db";
import { RequestCache, RequestService } from "@tryabby/services";
import { AfterRequestJobPayload } from "@tryabby/queue";

export async function handleAfterDataRequestJob(
  db: PrismaClient,
  { data: { projectId, apiVersion, functionDuration } }: Job<AfterRequestJobPayload>
) {
  await Promise.all([
    RequestCache.increment(projectId),
    RequestService.storeRequest(db, {
      projectId,
      type: "GET_CONFIG",
      durationInMs: functionDuration,
      apiVersion,
    }),
  ]);
}
