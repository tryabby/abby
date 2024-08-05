import {
  afterDataRequestWorkerFactory,
  AfterDataEventBatchArray,
} from "server/queue/AfterDataRequest";
import eventWorkerFactory, { EventJobPayload } from "server/queue/event";
import { EventService } from "server/services/EventService";

import { RequestCache } from "server/services/RequestCache";
import { RequestService } from "server/services/RequestService";

const afterDataRequestBatchArray: AfterDataEventBatchArray = [];
const eventBatchArray: EventJobPayload[] = [];

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("Registering workers...");

    const workers = await Promise.all([
      afterDataRequestWorkerFactory(afterDataRequestBatchArray),
      eventWorkerFactory(eventBatchArray, afterDataRequestBatchArray),
    ]);

    const gracefulShutdown = async (signal: string) => {
      console.log(`Received ${signal}, closing server...`);
      await Promise.all(workers.map((w) => w.close()));
      // Other asynchronous closings
      process.exit(0);
    };

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  }
}

setInterval(async () => {
  //TODO use lock?
  processEvents(afterDataRequestBatchArray, eventBatchArray);
});

const processEvents = async (
  afterDataRequestBatchArray: AfterDataEventBatchArray,
  testEventBatchArray: EventJobPayload[]
) => {
  // RequestCache.increment(event.projectId),
  await Promise.all([
    RequestService.storeRequest(afterDataRequestBatchArray),
    await EventService.createEvents(testEventBatchArray),
  ]);
};
