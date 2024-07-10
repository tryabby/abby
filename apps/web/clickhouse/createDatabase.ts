import { createClient } from "@clickhouse/client";
import { Prisma, PrismaClient } from "@prisma/client";
import { AbbyEventType } from "@tryabby/core";

const client = createClient({
  url: "http://localhost:8123",
});

// client
//   .command({
//     query: "CREATE DATABASE IF NOT EXISTS abby",
//   })
//   .then((res) => {
//     client.command({
//       query: `
//         DROP TABLE IF EXISTS abby.Event;
//       `,
//     });
//   })
//   .then((res) => {
//     client.command({
//       query: `
//         CREATE TABLE IF NOT EXISTS abby.Event (
//           id UUID,
//           project_id String,
//           testName String,
//           type Int,
//           selectedVariant String,
//           createdAt DateTime DEFAULT toDateTime(now()) NOT NULL,
//         )
//         ENGINE = MergeTree()
//         ORDER BY (project_id, testName)
//       `,
//     });
//   })
//   .catch((error) => {
//     console.error("Error creating table:", error);
//   });

async function insertEvents() {
  const projectId = "clvh4sv5n0001furg6tj08z63";
  const testName = "clyetopos0001yd6wa4yybkvw";

  for (let i = 0; i < 100_000; i++) {
    await client.insert({
      table: "abby.Event",
      format: "JSONEachRow",
      values: [
        {
          project_id: projectId,
          testName: testName,
          type: Math.random() < 0.5 ? AbbyEventType.PING : AbbyEventType.ACT,
          selectedVariant:
            Math.random() < 0.5 ? "New Variant 1" : "New Variant 2",
          createdAt:
            Math.floor(Date.now() / 1000) -
            Math.floor(Math.random() * 24 * 60 * 60),
        },
      ],
    });
  }
}

insertEvents();
