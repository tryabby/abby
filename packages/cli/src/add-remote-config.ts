import { loadLocalConfig } from "./util";
import chalk from "chalk";
import { push } from "./push";
import { default as prompts } from "prompts";
import { builders } from "magicast";

export async function addRemoteConfig(options: {
  apiKey: string;
  host?: string;
  configPath?: string;
}) {
  const { mutableConfig, saveMutableConfig, restoreConfig } = await loadLocalConfig({
    configPath: options.configPath,
  });

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

  if (!mutableConfig.remoteConfig) {
    mutableConfig.remoteConfig = builders.literal({});
  }

  if (remoteConfigName in mutableConfig.remoteConfig!) {
    console.log(chalk.red("A remote config with that name already exists!"));
    return;
  }

  mutableConfig.remoteConfig![remoteConfigName] = remoteConfigType;

  try {
    console.log(chalk.blue("Updating local config..."));
    await saveMutableConfig();
    console.log(chalk.green("Local config updated successfully"));

    console.log(chalk.blue("Updating remote config..."));
    await push({ apiKey: options.apiKey, configPath: options.configPath, apiUrl: options.host });
    console.log(chalk.green("Remote config updated successfully"));
  } catch (error) {
    console.log(chalk.red("Pushing the configuration failed. Restoring old config file..."));
    await restoreConfig();
    console.log(chalk.green("Old config restored."));

    // pass error to command handler
    throw error;
  }
}
