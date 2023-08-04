import * as fs from "fs/promises";
import { AbbyConfig, PullAbbyConfigResponse } from "@tryabby/core";
import { loadLocalConfig } from "./util";
import { HttpService } from "./http";
import { configRegex } from "./consts";
import deepmerge from "deepmerge";
import * as prettier from "prettier";

export function updateConfigFile(updatedConfig: AbbyConfig, configFileString: string) {
  const matchRegex = configRegex.exec(configFileString);

  const matchedObject = matchRegex?.at(1);

  if (!matchedObject) {
    throw new Error("Invalid config file");
  }

  const updatedContent = configFileString.replace(
    matchedObject,
    JSON.stringify(updatedConfig, null, 2)
  );

  return updatedContent;
}

export function mergeConfigs(localConfig: AbbyConfig, remoteConfig: PullAbbyConfigResponse) {
  return {
    ...localConfig,
    environments: Array.from(new Set([...localConfig.environments, ...remoteConfig.environments])),
    tests: deepmerge(localConfig.tests ?? {}, remoteConfig.tests ?? {}),
    flags: deepmerge(localConfig.flags ?? {}, remoteConfig.flags ?? {}),
  } satisfies AbbyConfig;
}

export async function pullAndMerge({
  apiKey,
  apiUrl,
  configPath,
}: {
  apiKey: string;
  apiUrl?: string;
  configPath?: string;
}): Promise<void> {
  const { config: localConfig, configFilePath } = await loadLocalConfig(configPath);

  const configFileContents = await fs.readFile(configFilePath, "utf-8");

  const remoteConfig = await HttpService.getConfigFromServer({
    projectId: localConfig.projectId,
    apiKey,
    apiUrl,
  });

  if (remoteConfig) {
    const updatedConfig = mergeConfigs(localConfig, remoteConfig);
    const updatedFileString = updateConfigFile(updatedConfig, configFileContents);

    if (!updatedFileString) {
      console.error("Config in file not found");
      return;
    }

    const formattedFile = await prettier.format(updatedFileString, {
      filepath: configFilePath,
    });

    await fs.writeFile(configFilePath, formattedFile);
  } else {
    console.error("Config in file not found");
  }
}
