import { default as promptly } from "promptly";
import * as fs from "fs/promises";
import * as prettier from "prettier";
import { loadLocalConfig } from "./util";
import chalk from "chalk";
import { mergeConfigs, updateConfigFile } from "./pull";
import { getToken } from "./auth";
import { push } from "./push";

export async function addFlag(options: { host?: string; configPath?: string }) {
  const flagName = await promptly.prompt("Enter the name of the flag you want to create: ");

  const { config, configFilePath } = await loadLocalConfig(options.configPath);
  const configFileContents = await fs.readFile(configFilePath, "utf-8");

  if (config.flags && config.flags.includes(flagName)) {
    console.log(chalk.red("A flag with that name already exists!"));
    return;
  }

  const newConfig = mergeConfigs(config, {
    environments: config.environments,
    flags: [flagName],
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
