import * as fs from "fs/promises";
import { default as prompts } from "prompts";
import { loadLocalConfig } from "./util";
import chalk from "chalk";
import { push } from "./push";
import { updateConfigFile } from "./update-config-file";

export async function addFlag(options: { apiKey: string; host?: string; configPath?: string }) {
  const { config, configFilePath } = await loadLocalConfig(options.configPath);
  const configFileContents = await fs.readFile(configFilePath, "utf-8");

  const oldConfig = JSON.parse(JSON.stringify(config));

  const { flagName } = await prompts({
    type: "text",
    name: "flagName",
    message: "Type the name for your new flag: ",
  });

  if (!config.flags) {
    config.flags = [];
  }

  if (config.flags.includes(flagName)) {
    console.log(chalk.red("A flag with that name already exists!"));
    return;
  }

  config.flags.push(flagName);

  console.log(chalk.blue("Updating local config..."));
  await updateConfigFile(config, configFileContents, configFilePath);
  console.log(chalk.green("Local config updated successfully"));

  console.log(chalk.blue("Updating remote config..."));

  try {
    await push({ apiKey: options.apiKey, configPath: options.configPath, apiUrl: options.host });
  } catch (error) {
    console.log(chalk.red("Pushing flag failed, restoring old config file..."));

    await updateConfigFile(oldConfig, configFileContents, configFilePath);

    console.log(chalk.green("Restored old config file"));

    // pass error to command handler
    throw error;
  }
}
