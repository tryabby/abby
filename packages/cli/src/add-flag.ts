import * as fs from "fs/promises";
import { default as prompts } from "prompts";
import { loadLocalConfig } from "./util";
import chalk from "chalk";
import { push } from "./push";
import { updateConfigFile } from "./update-config-file";

export async function addFlag(options: { apiKey: string; host?: string; configPath?: string }) {
  const { mutableConfig, saveMutableConfig, restoreConfig } = await loadLocalConfig(
    options.configPath
  );

  const { flagName } = await prompts({
    type: "text",
    name: "flagName",
    message: "Type the name for your new flag: ",
  });

  if (!mutableConfig.flags) {
    mutableConfig.flags = [];
  }

  if (mutableConfig.flags.includes(flagName)) {
    console.log(chalk.red("A flag with that name already exists!"));
    return;
  }

  mutableConfig.flags.push(flagName);

  try {
    console.log(chalk.blue("Updating local config..."));
    await saveMutableConfig();
    console.log(chalk.green("Local config updated successfully"));

    console.log(chalk.blue("Updating remote config..."));
    await push({ apiKey: options.apiKey, configPath: options.configPath, apiUrl: options.host });
  } catch (error) {
    console.log(chalk.red("Pushing flag failed, restoring old config file..."));

    await restoreConfig();

    console.log(chalk.green("Restored old config file"));
    // pass error to command handler
    throw error;
  }
}
