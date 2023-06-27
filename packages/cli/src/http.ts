import { AbbyConfig } from "@tryabby/core";
import { ConfigData, Tests } from "./types";

export async function getConfigFromServer(
  projectId: string,
  debug?: boolean
): Promise<ConfigData> {
  let responseJson: any;

  if (debug) {
    const response = await fetch(
      `http://localhost:3000/api/config/${projectId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    responseJson = await response.json();
  } else {
    const response = await fetch(
      `http://www.tryabby.com/api/dashboard/${projectId}/data`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    responseJson = await response.json();
  }
  return responseJson;
}

export async function createTest(projectId: string) {
  console.log("createTest");
}

export async function createFlag(projectId: string, flagName: string) {
  console.log("createFlag");
}

export async function updateConfigOnServer(config: any) {
  const response = await fetch(
    `http://www.tryabby.com/api/dashboard/${config.projectId}/data`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config),
    }
  );
  const responseJson = await response.json();

  console.log(responseJson);
}
