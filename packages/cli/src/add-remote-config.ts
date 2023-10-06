import { default as promptly } from "promptly";
import * as fs from "fs/promises";
import * as prettier from "prettier";
import { loadLocalConfig } from "./util";
import chalk from "chalk";
import { mergeConfigs, updateConfigFile } from "./pull";
import { getToken } from "./auth";
import { push } from "./push";

export async function addRemoteConfig(options: { host?: string; configPath?: string }) {
  const remoteConfigName = await promptly.prompt(
    "Enter the name of the remote config you want to create: "
  );

  const { config, configFilePath } = await loadLocalConfig(options.configPath);
  const configFileContents = await fs.readFile(configFilePath, "utf-8");

  if (config.remoteConfig && remoteConfigName in config.remoteConfig) {
    console.log(chalk.red("A remote config with that name already exists!"));
    return;
  }

  const remoteConfigType = (await promptly.choose(
    "What type should your remote config have? (String, Number or JSON)",
    ["String", "Number", "JSON"]
  )) as "String" | "Number" | "JSON";

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
