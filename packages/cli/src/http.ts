import { AbbyConfig, PullAbbyConfigResponse } from "@tryabby/core";
import { ABBY_BASE_URL } from "./consts";
import fetch from "node-fetch";
import { multiLineLog } from "./util";
import chalk from "chalk";
import { writeFile } from "fs/promises";

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

    const response = await fetch(`${url}/api/v1/config/${projectId}`, {
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
    return responseJson as PullAbbyConfigResponse;
  }

  static async updateConfigOnServer({
    apiKey,
    localAbbyConfig,
    apiUrl,
  }: {
    apiKey: string;
    localAbbyConfig: AbbyConfig;
    apiUrl?: string;
  }) {
    const url = apiUrl ?? ABBY_BASE_URL;

    try {
      const response = await fetch(`${url}/api/v1/config/${localAbbyConfig.projectId}`, {
        method: "PUT",
        headers: {
          Authorization: "Bearer " + apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(localAbbyConfig),
      });

      const status = response.status;

      if (status === 200) {
        console.log(chalk.green("Config was pushed successfully"));
      } else if (status === 500) {
        throw new Error("Internal server error while pushing config");
      } else if (status === 401) {
        throw new Error("Invalid API Key");
      } else {
        throw new Error("Push failed");
      }
    } catch (e) {
      console.log(chalk.red(multiLineLog("Error: " + e)));
      throw e;
    }
  }

  static async getFilesWithFlagsRemoved({
    apiKey,
    files,
    flagName,
    apiUrl,
  }: {
    apiKey: string;
    files: Array<{ filePath: string; fileContent: string }>;
    flagName: string;
    apiUrl?: string;
  }) {
    const url = apiUrl ?? ABBY_BASE_URL;

    try {
      const response = await fetch(`${url}/api/ee/v1/abby-ai/flag-removal`, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          flagName,
          files,
        }),
      });

      const status = response.status;

      if (status === 200) {
        const res = await response.json();
        if (!Array.isArray(res)) {
          throw new Error("Invalid response from server");
        }
        await Promise.all(res.map((file) => writeFile(file.filePath, file.fileContent)));
      } else if (status === 500) {
        throw new Error("Internal server error trying to update files");
      } else if (status === 401) {
        throw new Error("Invalid API Key");
      } else {
        throw new Error("Unable to update files");
      }
    } catch (e) {
      console.log(chalk.red(multiLineLog("Error: " + e)));
      throw e;
    }
  }
}
