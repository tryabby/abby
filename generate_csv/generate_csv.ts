import { createObjectCsvWriter } from "csv-writer";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";

// Constants
const NUM_ENTRIES = 10_000_000;
const PROJECT_COUNT = 100;
const API_VERSION = "V0";
const TYPES = ["GET_CONFIG", "POST_UPDATE", "DELETE_RECORD", "PUT_RESOURCE"];

// Generate a random date between today and one year ago
function randomDate(): string {
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  const randomTime = new Date(
    oneYearAgo.getTime() + Math.random() * (today.getTime() - oneYearAgo.getTime())
  );
  return randomTime.toISOString().replace("T", " ").substring(0, 23);
}

// Generate project IDs
const projectIds = ["clvh4sv5n0001furg6tj08z63"];

// Setup CSV writer
const csvWriter = createObjectCsvWriter({
  path: "ApiRequest.csv",
  header: [
    { id: "id", title: "id" },
    { id: "createdAt", title: "createdAt" },
    { id: "type", title: "type" },
    { id: "durationInMs", title: "durationInMs" },
    { id: "apiVersion", title: "apiVersion" },
    { id: "projectId", title: "projectId" },
  ],
});

async function generateCSV() {
  const records: any = [];
  for (let i = 0; i < NUM_ENTRIES; i++) {
    const record = {
      id: uuidv4(),
      createdAt: randomDate(),
      type: TYPES[Math.floor(Math.random() * TYPES.length)],
      durationInMs: Math.floor(Math.random() * 1000) + 1,
      apiVersion: API_VERSION,
      projectId: "clvh4sv5n0001furg6tj08z63",
      //   projectIds[Math.floor(Math.random() * PROJECT_COUNT)],
    };
    records.push(record);

    // Write in chunks to avoid memory issues
    if (records.length === 100000) {
      await csvWriter.writeRecords(records);
      records.length = 0; // Clear the array
    }
  }
  if (records.length > 0) {
    await csvWriter.writeRecords(records);
  }
  console.log("CSV file generated successfully!");
}

generateCSV().catch((err) => {
  console.error("Error generating CSV:", err);
});
