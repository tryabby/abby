import * as fs from "fs/promises";
import { AbbyConfig } from "@tryabby/core";
import { loadLocalConfig } from "./util";

import { HttpService } from "./http";
import { configRegex } from "./consts";
import deepmerge from "deepmerge";

export async function updateConfigFile(updatedConfig: AbbyConfig, configFileString: string) {
  const updatedContent = configFileString.replace(
    configRegex,
    JSON.stringify(updatedConfig, null, 2)
  );

  return updatedContent;
}

export function mergeConfigs(localConfig: AbbyConfig, remoteConfig: AbbyConfig) {
  return deepmerge(localConfig, remoteConfig);
}

export async function pullAndMerge({
  apiKey,
  localhost,
}: {
  apiKey: string;
  localhost?: boolean;
}): Promise<void> {
  const { config: localConfig, configFilePath } = await loadLocalConfig();

  const configFileContents = await fs.readFile(configFilePath, "utf-8");

  const remoteConfig = await HttpService.getConfigFromServer(
    localConfig.projectId,
    apiKey,
    localhost
  );

  if (remoteConfig) {
    const updatedConfig = mergeConfigs(localConfig, remoteConfig);
    const updatedFileString = await updateConfigFile(updatedConfig, configFileContents);

    if (!updatedFileString) {
      console.error("Config in file not found");
      return;
    }

    await fs.writeFile(configFilePath, updatedFileString);
  } else {
    console.error("Config in file not found");
  }
}
