import * as fs from "fs/promises";
import {
  AbbyConfig,
  PullAbbyConfigResponse,
  DynamicConfigKeys,
  DYNAMIC_ABBY_CONFIG_KEYS,
} from "@tryabby/core";
import { loadLocalConfig } from "./util";
import { HttpService } from "./http";
import deepmerge from "deepmerge";
import * as prettier from "prettier";

export function updateConfigFile(
  updatedConfig: Omit<AbbyConfig, DynamicConfigKeys>,
  configFileString: string
) {
  // filter out keys that are marked as dynamic. Those are set in the
  // first parameter of `defineConfig`, but we are only updating the
  // second parameter.
  updatedConfig = Object.fromEntries(
    Object.entries(updatedConfig).filter(
      ([key]) => !(DYNAMIC_ABBY_CONFIG_KEYS as readonly string[]).includes(key)
    )
  ) as Omit<AbbyConfig, DynamicConfigKeys>;

  // remove new lines
  configFileString = configFileString.replace(/(?:\r\n|\r|\n)/g, "");

  const configRegex = /defineConfig.*, *({.*})/g;
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
    flags: deepmerge(localConfig.flags ?? [], remoteConfig.flags ?? []),
    remoteConfig: deepmerge(localConfig.remoteConfig ?? {}, remoteConfig.remoteConfig ?? {}),
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
