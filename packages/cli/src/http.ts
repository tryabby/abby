import { AbbyConfig } from "@tryabby/core";
import { ConfigData, Tests } from "./types";

export async function getConfig(projectId: string): Promise<ConfigData> {
  let tests: Tests = {};
  let flags = [];
  const response = await fetch(
    `http://www.tryabby.com/api/dashboard/${projectId}/data`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const responseJson = await response.json();

  // TODO add dynamic variants
  for (const test of responseJson.tests) {
    tests[test.name] = { variants: ["A", "B", "C"] };
  }

  for (const flag of responseJson.flags) {
    flags.push(flag.name);
  }

  const config: ConfigData = { tests, flags };

  return config;
}

export async function createTest(projectId: string) {
  console.log("createTest");
}

export async function createFlag(projectId: string, flagName: string) {
  console.log("createFlag");
}
