import * as fs from "node:fs/promises";
import {
  type AbbyConfig,
  DYNAMIC_ABBY_CONFIG_KEYS,
  type DynamicConfigKeys,
} from "@tryabby/core";
import * as prettier from "prettier";

export async function updateConfigFile(
  updatedConfig: Omit<AbbyConfig, DynamicConfigKeys>,
  configFileString: string,
  configFilePath: string
) {
  const newContent = updateConfigFileContent(updatedConfig, configFileString);

  if (!newContent) {
    console.error("Config in file not found");
    return;
  }

  const formattedFile = await prettier.format(newContent, {
    filepath: configFilePath,
  });

  await fs.writeFile(configFilePath, formattedFile);
}

function updateConfigFileContent(
  updatedConfig: Omit<AbbyConfig, DynamicConfigKeys>,
  configFileString: string
): string {
  // filter out keys that are marked as dynamic. Those are set in the
  // first parameter of `defineConfig`, but we are only updating the
  // second parameter.
  // biome-ignore lint:
  updatedConfig = Object.fromEntries(
    Object.entries(updatedConfig).filter(
      ([key]) => !(DYNAMIC_ABBY_CONFIG_KEYS as readonly string[]).includes(key)
    )
  ) as Omit<AbbyConfig, DynamicConfigKeys>;

  // replaces newlines inside the `defineConfig(...)` part of the config
  const defineConfigRegex = /defineConfig\(\s*{([\s\S]*?)}[\s\S]*\)/;
  // biome-ignore lint:
  configFileString = configFileString.replace(defineConfigRegex, (match) => {
    const replacedParameters = match.replace(/(?:\r\n|\r|\n)/g, " ");
    return replacedParameters;
  });

  const configRegex = /defineConfig.*, *({.*})/g;
  const matchRegex = configRegex.exec(configFileString);
  const matchedObject = matchRegex?.at(1);

  if (!matchedObject) {
    throw new Error("Invalid config file");
  }

  const updatedContent = configFileString.replace(
    matchedObject,
    JSON.stringify(updatedConfig, null, 2)
  );

  return updatedContent;
}
