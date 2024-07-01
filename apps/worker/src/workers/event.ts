import { Job } from "bullmq";
import { PrismaClient } from "@tryabby/db";
import { EventJobPayload } from "@tryabby/queue";
import { RequestCache, RequestService } from "@tryabby/services";
import { AbbyEventType } from "@tryabby/core";

export async function handleEventJob(
  db: PrismaClient,
  {
    data: { projectId, functionDuration, selectedVariant, testName, type: eventType },
  }: Job<EventJobPayload>
) {
  switch (eventType) {
    case AbbyEventType.PING:
    case AbbyEventType.ACT: {
      await db.event.create({
        data: {
          selectedVariant,
          type: eventType,
          test: {
            connect: {
              projectId_name: {
                projectId,
                name: testName,
              },
            },
          },
        },
      });
      break;
    }
    default: {
      eventType satisfies never;
    }
  }
  await Promise.all([
    RequestCache.increment(projectId),
    RequestService.storeRequest(db, {
      projectId,
      type: "GET_CONFIG",
      durationInMs: functionDuration,
      apiVersion: "V1",
    }),
  ]);
}
