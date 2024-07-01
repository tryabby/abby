import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import type { WorkerOptions } from "bullmq";
import { Worker } from "bullmq";
import express from "express";
import basicAuth from "express-basic-auth";

import { afterDataRequestQueue, eventQueue, connection } from "@tryabby/queue";

import { handleAfterDataRequestJob } from "./workers/afterDataRequest";
import { handleEventJob } from "./workers/event";
import { PrismaClient } from "@tryabby/db";

const PORT = parseInt(process.env.WORKER_PORT || "3006", 10);
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/");
const app = express();

const workerOptions: WorkerOptions = {
  connection,
  concurrency: parseInt(process.env.CONCURRENCY || "1", 10),
};

let db: PrismaClient;

async function start() {
  db = new PrismaClient();
  const workers = [
    new Worker(afterDataRequestQueue.name, (job) => handleEventJob(db, job), workerOptions),
    new Worker(eventQueue.name, (job) => handleAfterDataRequestJob(db, job), workerOptions),
  ];

  createBullBoard({
    queues: [new BullMQAdapter(eventQueue), new BullMQAdapter(afterDataRequestQueue)],
    serverAdapter: serverAdapter,
  });

  if (process.env.NODE_ENV === "production") {
    if (!process.env.WORKER_USERNAME || !process.env.WORKER_PASSWORD) {
      throw new Error("Missing WORKER_USERNAME or WORKER_PASSWORD in production environment");
    }
    app.use(
      basicAuth({
        users: { [process.env.WORKER_USERNAME]: process.env.WORKER_PASSWORD },
        challenge: true,
      })
    );
  }

  app.use("/", serverAdapter.getRouter());

  app.listen(PORT, () => {
    console.log(`For the UI, open http://localhost:${PORT}/`);
  });

  ["SIGTERM", "SIGINT"].forEach((signal) => {
    // signal handlers
    process.on(signal, async () => {
      console.log("Closing workers...");
      await Promise.all(workers.map((worker) => worker.close()));
      await db.$disconnect();
      process.exit(0);
    });
  });
}

start();
