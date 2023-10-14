import * as fs from "fs/promises";
import { loadLocalConfig } from "./util";
import chalk from "chalk";
import { push } from "./push";
import { default as prompts } from "prompts";
import { updateConfigFile } from "./update-config-file";

export async function addRemoteConfig(options: {
  apiKey: string;
  host?: string;
  configPath?: string;
}) {
  const { config, configFilePath } = await loadLocalConfig(options.configPath);
  const configFileContents = await fs.readFile(configFilePath, "utf-8");

  const oldConfig = JSON.parse(JSON.stringify(config));

  const { remoteConfigName, remoteConfigType } = await prompts([
    {
      type: "text",
      name: "remoteConfigName",
      message: "Type the name for your new remote config: ",
    },
    {
      type: "select",
      name: "remoteConfigType",
      message: "Select the type for your new remote config: ",
      choices: [
        {
          title: "String",
          value: "String",
        },
        {
          title: "Number",
          value: "Number",
        },
        {
          title: "JSON",
          value: "JSON",
        },
      ],
    },
  ]);

  if (!config.remoteConfig) {
    config.remoteConfig = {};
  }

  if (remoteConfigName in config.remoteConfig) {
    console.log(chalk.red("A remote config with that name already exists!"));
    return;
  }

  config.remoteConfig[remoteConfigName] = remoteConfigType;

  console.log(chalk.blue("Updating local config..."));
  await updateConfigFile(config, configFileContents, configFilePath);
  console.log(chalk.green("Local config updated successfully"));

  console.log(chalk.blue("Updating remote config..."));
  try {
    await push({ apiKey: options.apiKey, configPath: options.configPath, apiUrl: options.host });
  } catch (error) {
    console.log(chalk.red("Pushing the configuration failed. Restoring old config file..."));
    await updateConfigFile(oldConfig, configFileContents, configFilePath);
    console.log(chalk.green("Old config restored."));

    // pass error to command handler
    throw error;
  }
}
