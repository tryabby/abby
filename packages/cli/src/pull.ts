import * as path from "path";
import * as fs from "fs";
import { AbbyConfig } from "@tryabby/core";
import { loadLocalConfig, updateConfigFile } from "./util";

import { getConfigFromFileString } from "./util";
import { ConfigData } from "./types";
import { getConfig } from "./http";

async function updateConfig(
  configFromFile: AbbyConfig,
  configFromAbby: ConfigData
): Promise<string> {
  const newConfig: Omit<AbbyConfig, "flags"> & { flags: string[] } = {
    projectId: configFromFile.projectId,
    currentEnvironment: configFromFile.currentEnvironment,
    tests: configFromAbby.tests ?? configFromFile.tests,
    flags: configFromAbby.flags ?? configFromFile.flags,
  };

  let updatedConfigString = JSON.stringify(newConfig, null, 2);

  updatedConfigString = updatedConfigString.replace(/"([^"]+)":/g, "$1:");

  return updatedConfigString;
}

export async function pull(): Promise<void> {
  const configFileString: string = await loadLocalConfig();
  const configFromFile: AbbyConfig = getConfigFromFileString(configFileString);

  const configFromAbby = await getConfig("clftg3tzd0004l7085yktpsov");

  const updatedConfig = await updateConfig(configFromFile, configFromAbby);

  updateConfigFile(updatedConfig, configFileString);
}
