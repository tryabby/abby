import { AbbyConfig } from "@tryabby/core";
import { ConfigData } from "./types";
import {ABBY_BASE_URL, LOCAL_BASE_URL} from "./consts";
import fetch from "node-fetch"

/*export async function getConfigFromServer(
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
}*/

export async function getConfigFromServer(projectId: string, apiKey: string, localhost?: boolean): Promise<string> {

}

export async function updateConfigOnServer(projectId: string, apiKey: string, localAbbyConfig: AbbyConfig, localhost?: boolean) {
    let url: string;

    if (localhost) {
        console.log("LOCAL")
        url = LOCAL_BASE_URL;
    } else {
        url = ABBY_BASE_URL;
    }

    try {
        const response = await fetch(
            `${url}/api/config/${projectId}?apiKey=${apiKey}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(localAbbyConfig),
            }
        );
        // const res = await response;
        const data = await response.json();
        const status: number = response.status;

        if (status == 200) {
            console.log("pushed successfully");
        } else {
            console.log("pushed failed: \n" + status + ": " + data);
        }
    } catch (e) {
        console.log("Error: " + e);
    }
}
