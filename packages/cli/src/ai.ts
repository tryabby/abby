import { loadLocalConfig } from "./util";
import { globby } from "globby";
import { getUseFeatureFlagRegex } from "@tryabby/core";
import { readFile } from "fs/promises";
import chalk from "chalk";
import { HttpService } from "./http";

export async function removeFlagInstance(options: {
  flagName: string;
  apiKey: string;
  path: string;
  host?: string;
  configPath?: string;
}) {
  const files = await globby("**/*.tsx", {
    cwd: options.path ?? process.cwd(),
    absolute: true,
    gitignore: true,
    onlyFiles: true,
  });

  const regex = getUseFeatureFlagRegex(options.flagName);

  const filesToUse = (
    await Promise.all(
      files.flatMap(async (filePath) => {
        const content = await readFile(filePath, "utf-8").then((content) => {
          const matches = content.match(regex);
          return matches ? content : null;
        });
        if (!content) return [];

        return {
          filePath,
          fileContent: content,
        };
      })
    )
  ).flat();

  await HttpService.getFilesWithFlagsRemoved({
    apiKey: options.apiKey,
    files: filesToUse,
    flagName: options.flagName,
    apiUrl: options.host,
  });

  try {
    const { mutableConfig, saveMutableConfig } = await loadLocalConfig(
      options.configPath
    );
    mutableConfig.flags = mutableConfig.flags.filter((flag: string) => flag !== options.flagName);
    await saveMutableConfig();
  } catch (e) {
    // fail silently
  }
  console.log(chalk.green("Flag removed successfully"));
}
