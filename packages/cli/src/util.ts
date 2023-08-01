import { abbyConfigSchema } from "@tryabby/core";
import { loadConfig } from "unconfig";
import { config as loadEnv } from "dotenv";

export async function loadLocalConfig() {
  loadEnv()
  const { config, sources } = await loadConfig({
    sources: [
      {
        files: "abby.config",
        extensions: ["ts", "js", "mjs", "cjs"],
        async rewrite(config) {
          const resolved = await (typeof config === "function" ? config() : config);
          return resolved;
        },
      },
    ],
  });
  if (!config || !sources[0]) throw new Error("Could not load config file");

  const result = await abbyConfigSchema.safeParseAsync(config);
  if (!result.success) {
    console.error(result.error);
    throw new Error("Invalid config file");
  }
  return { config: result.data, configFilePath: sources[0] };
}
