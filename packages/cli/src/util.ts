import { abbyConfigSchema } from "@tryabby/core";
import { loadConfig } from "unconfig";
import { config as loadEnv } from "dotenv";
import path from "path";

export async function loadLocalConfig(configPath?: string) {
  loadEnv();

  let cwd = process.cwd();
  let fileName = "abby.config";
  let extensions = ["ts", "js", "mjs", "cjs"];

  // if configPath is provided, use it to load the config
  if (configPath) {
    const config = path.resolve(configPath);

    cwd = path.dirname(config);
    fileName = path.basename(config, path.extname(config));
    extensions = [path.extname(config).slice(1)];
  }

  const { config, sources } = await loadConfig({
    sources: [
      {
        files: fileName,
        extensions,
      },
    ],
    cwd,
  });

  if (!config || !sources[0]) throw new Error("Could not load config file");

  const result = await abbyConfigSchema.safeParseAsync(config);
  if (!result.success) {
    console.error(result.error);
    throw new Error("Invalid config file");
  }
  return { config: result.data, configFilePath: sources[0] };
}

export function multiLineLog(...args: any[]) {
  console.log(args.join("\n"));
}
