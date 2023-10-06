import * as fs from "fs/promises";
import * as prettier from "prettier";
import { default as prompts } from "prompts";
import { loadLocalConfig } from "./util";
import chalk from "chalk";
import { mergeConfigs, updateConfigFile } from "./pull";
import { push } from "./push";

export async function addFlag(options: { apiKey: string; host?: string; configPath?: string }) {
  const { config, configFilePath } = await loadLocalConfig(options.configPath);
  const configFileContents = await fs.readFile(configFilePath, "utf-8");

  const { flagName } = await prompts({
    type: "text",
    name: "flagName",
    message: "Type the name for your new flag: ",
  });

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
  await push({ apiKey: options.apiKey, configPath: options.configPath, apiUrl: options.host });
}
