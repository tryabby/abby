import { AbbyConfig } from "@tryabby/core";
import { ABBY_BASE_URL, LOCAL_BASE_URL } from "./consts";
import fetch from "node-fetch";

export abstract class HttpService {
  static async getConfigFromServer(projectId: string, apiKey: string, localhost?: boolean) {
    let url: string;

    if (localhost) {
      console.log("LOCAL");
      url = LOCAL_BASE_URL;
    } else {
      url = ABBY_BASE_URL;
    }
    try {
      // TODO: refactor to use header
      const response = await fetch(`${url}/api/config/${projectId}?apiKey=${apiKey}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const responseJson = await response.json();
      return responseJson as AbbyConfig;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  static async updateConfigOnServer(
    projectId: string,
    apiKey: string,
    localAbbyConfig: AbbyConfig,
    localhost?: boolean
  ) {
    let url: string;

    if (localhost) {
      console.log("LOCAL");
      url = LOCAL_BASE_URL;
    } else {
      url = ABBY_BASE_URL;
    }

    try {
      // TODO: refactor to use header
      const response = await fetch(`${url}api/config/${projectId}?apiKey=${apiKey}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(localAbbyConfig),
      });

      const data = await response.json();
      const status = response.status;

      if (status == 200) {
        console.log("pushed successfully");
      } else if (status == 500) {
        console.log("Pushed failed \n Please try again later \n 500: Internal server error");
      } else if (status == 401) {
        console.log("Pushed failed \n Please check your API key \n" + data);
      } else {
        console.log("Pushed failed: \n" + status + ": " + data);
      }
    } catch (e) {
      console.log("Error: " + e);
    }
  }
}
