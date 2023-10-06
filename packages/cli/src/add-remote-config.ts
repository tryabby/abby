import * as fs from "fs/promises";
import * as prettier from "prettier";
import { loadLocalConfig } from "./util";
import chalk from "chalk";
import { mergeConfigs, updateConfigFile } from "./pull";
import { getToken } from "./auth";
import { push } from "./push";
import { default as prompts } from "prompts";

export async function addRemoteConfig(options: { host?: string; configPath?: string }) {
  const { config, configFilePath } = await loadLocalConfig(options.configPath);
  const configFileContents = await fs.readFile(configFilePath, "utf-8");

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

  if (config.remoteConfig && remoteConfigName in config.remoteConfig) {
    console.log(chalk.red("A remote config with that name already exists!"));
    return;
  }

  const newConfig = mergeConfigs(config, {
    environments: config.environments,
    remoteConfig: { [remoteConfigName]: remoteConfigType },
  });

  console.log(chalk.blue("Updating local config..."));
  const updatedFileString = updateConfigFile(newConfig, configFileContents);
  const formattedFile = await prettier.format(updatedFileString, {
    filepath: configFilePath,
  });
  await fs.writeFile(configFilePath, formattedFile);
  console.log(chalk.green("Local config updated successfully"));

  console.log(chalk.blue("Updating remote config..."));
  const token = await getToken();
  await push({ apiKey: token, configPath: options.configPath, apiUrl: options.host });
}
