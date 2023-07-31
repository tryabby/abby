import * as path from "path";
import * as fs from "fs";
import { AbbyConfig } from "@tryabby/core";
import { getFramework, getParsedJSONString, loadLocalConfig } from "./util";

import { getConfigFromFileString } from "./util";
import { ConfigData } from "./types";
import { HttpService } from "./http";

export async function updateConfigFile(updatedConfig: string, configFileString: string) {
  const framework = getFramework(configFileString);
  if (!framework) return;

  const updatedContent = configFileString.replace(framework.replaceRegex, updatedConfig);

  console.log(updatedContent);

  return updatedContent;
}

export async function updateConfig(
  configFromFile: AbbyConfig,
  configFromAbby: AbbyConfig
): Promise<string> {
  const newConfig: AbbyConfig = {
    projectId: configFromFile.projectId,
    currentEnvironment: configFromFile.currentEnvironment,
    tests: configFromAbby.tests ?? configFromFile.tests,
    flags: configFromAbby.flags ?? configFromFile.flags,
  };

  const updatedConfigString = getParsedJSONString(newConfig);
  return updatedConfigString;
}

export async function pull(filePath: string, apiKey: string, localhost?: boolean): Promise<void> {
  const configFileString = await loadLocalConfig(filePath);
  const configFromFile = getConfigFromFileString(configFileString);

  const configFromAbby = await HttpService.getConfigFromServer(
    configFromFile.projectId,
    apiKey,
    localhost
  );

  if (configFromAbby) {
    const updatedConfig = await updateConfig(configFromFile, configFromAbby);
    const updatedFileString = await updateConfigFile(updatedConfig, configFileString);

    if (!updatedFileString) {
      console.error("Config in file not found");
      return;
    }

    fs.writeFile(filePath, updatedFileString, (error) => {
      if (error) {
        console.error(error);
        return;
      }
      console.log("Config File updated");
    });
  } else console.error("Config in file not found");
}
