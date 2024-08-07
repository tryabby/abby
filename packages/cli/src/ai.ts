import { readFile } from "node:fs/promises";
import * as path from "node:path";
import { getUseFeatureFlagRegex } from "@tryabby/core";
import { globby } from "globby";
import { HttpService } from "./http";
import { loadLocalConfig } from "./util";

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
