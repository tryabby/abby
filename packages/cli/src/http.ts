import { AbbyConfig } from "@tryabby/core";
import { ABBY_BASE_URL, LOCAL_BASE_URL } from "./consts";
import fetch from "node-fetch";

export abstract class HttpService {
  static async getConfigFromServer({
    projectId,
    apiKey,
    apiUrl,
  }: {
    projectId: string;
    apiKey: string;
    apiUrl?: string;
  }) {
    const url = apiUrl ?? ABBY_BASE_URL;

    const response = await fetch(`${url}/api/config/${projectId}`, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Invalid response from server");
    }

    const responseJson = await response.json();
    return responseJson as AbbyConfig;
  }

  static async updateConfigOnServer({
    projectId,
    apiKey,
    localAbbyConfig,
    apiUrl,
  }: {
    projectId: string;
    apiKey: string;
    localAbbyConfig: AbbyConfig;
    apiUrl?: string;
  }) {
    const url = apiUrl ?? ABBY_BASE_URL;

    try {
      const response = await fetch(`${url}api/config/${projectId}`, {
        method: "PUT",
        headers: {
          Authorization: "Bearer " + apiKey,
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
