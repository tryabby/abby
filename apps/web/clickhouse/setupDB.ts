import { ResultSet, createClient } from "@clickhouse/client";
import { AbbyEvent, AbbyEventType } from "@tryabby/core";
import { coolGray } from "tailwindcss/colors";
import { z } from "zod";

const client = createClient({
  url: "http://localhost:8123",
});
async function getVariantCount(projectId: string, testId: string) {
  const res = await client.query({
    query: `SELECT COUNT(selectedVariant) AS variant_count, testName, selectedVariant, type
    FROM abby.Event
    WHERE project_id = '${projectId}'

    GROUP BY testName, selectedVariant, type
      `,
    format: "JSONEachRow",
  });
  return res;
}

let dataToInsert = [
  {
    project_id: "12321",
    testName: "footer",
    type: AbbyEventType.ACT,
    selectedVariant: "A",
  },
  {
    project_id: "12321",
    testName: "footer",
    type: AbbyEventType.PING,
    selectedVariant: "A",
  },
  {
    project_id: "12321",
    testName: "footer",
    type: AbbyEventType.ACT,
    selectedVariant: "B",
  },
  {
    project_id: "12321",
    testName: "footer",
    type: AbbyEventType.PING,
    selectedVariant: "B",
  },
  {
    project_id: "123",
    testName: "footer",
    type: AbbyEventType.ACT,
    selectedVariant: "A",
  },
  {
    project_id: "123",
    testName: "footer",
    type: AbbyEventType.PING,
    selectedVariant: "A",
  },
  {
    project_id: "123",
    testName: "footer",
    type: AbbyEventType.ACT,
    selectedVariant: "B",
  },
  {
    project_id: "123",
    testName: "footer",
    type: AbbyEventType.PING,
    selectedVariant: "B",
  },
];

for (let i = 0; i < 12; i++) {
  dataToInsert = dataToInsert.concat(dataToInsert);
}

console.log(dataToInsert.length);

async function test() {
  const beforeCount = await client
    .query({
      query: "SELECT COUNT(*) FROM abby.Event",
      format: "JSONEachRow",
    })
    .then((data) => data.json())
    .then((data) => data)
    .catch((err) => console.log(err));

  console.log("before", beforeCount);
  console.time("insert");

  for (let x = 0; x < 10_000; x++) {
    await client.insert({
      table: "abby.Event",
      values: dataToInsert,
      format: "JSONEachRow",
    });
  }

  console.timeEnd("insert");
  console.log("done insert");

  const afterCount = await client
    .query({
      query: "SELECT COUNT(*) FROM abby.Event",
      format: "JSONEachRow",
    })
    .then((data) => data.json())
    .then((data) => data)
    .catch((err) => console.log(err));

  console.log("after", afterCount);
}

// console.time("insert");
// test();
// console.timeEnd("insert");

console.time("query");
getVariantCount("12321", "footer").then((data) => {
  data.json().then((data) => console.log(data));
  console.timeEnd("query");
});
