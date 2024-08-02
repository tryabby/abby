import { loadLocalConfig } from "./util";
import { globby } from "globby";
import { getUseFeatureFlagRegex } from "@tryabby/core";
import { readFile } from "fs/promises";
import chalk from "chalk";
import { HttpService } from "./http";
import * as path from "path";

export async function removeFlagInstance(options: {
  flagName: string;
  apiKey: string;
  path: string;
  host?: string;
  configPath?: string;
}) {
  const files = await globby("**/*.tsx", {
    cwd: options.path,
    gitignore: true,
    onlyFiles: true,
  });

  const regex = getUseFeatureFlagRegex(options.flagName);

  const filesToUse = (
    await Promise.all(
      files.flatMap(async (fp) => {
        const filePath = path.join(options.path, fp);
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

  let updatedFileCount = filesToUse.length;
  try {
    const { mutableConfig, saveMutableConfig } = await loadLocalConfig({
      configPath: options.configPath,
      cwd: options.path,
    });

    if (mutableConfig.flags === undefined) {
      console.error("No flags found in the config file");
      return;
    }

    mutableConfig.flags = Array.from(mutableConfig.flags).filter(
      (flag) => flag !== options.flagName
    );
    updatedFileCount++;
    await saveMutableConfig();
  } catch (e) {
    console.error(e);
    // fail silently
  }
  return updatedFileCount;
}
