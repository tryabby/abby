import { createClient } from "@clickhouse/client";

const client = createClient({
  url: "http://localhost:8123",
});

client
  .command({
    query: "CREATE DATABASE IF NOT EXISTS abby",
  })
  .then((res) => {
    client.command({
      query: `
      DROP TABLE IF EXISTS abby.Event;
      `,
    });
  })
  .then((res) => {
    client.command({
      query: `
      CREATE TABLE IF NOT EXISTS abby.Event (
      id String,
      project_id String,
      testName String,
      type Int,
      selectedVariant String,
      createdAt DateTime DEFAULT toDateTime(now()) NOT NULL,

    ) 
    ENGINE = MergeTree() 
    ORDER BY (project_id, testName)
      `,
    });
  });
