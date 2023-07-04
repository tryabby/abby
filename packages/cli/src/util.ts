import { AbbyConfig } from "@tryabby/core";
import * as fs from "fs";

export function loadLocalConfig(filePath: string): Promise<string> {
  // TODO search for file. it just works, when the file is in root
  return new Promise<string>((resolve, reject) => {
    fs.readFile(filePath, "utf8", (error, data) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(data);
    });
  });
}

export function updateConfigFile(
  updatedConfig: string,
  configFileString: string
) {
  const existingObjectRegex = /(export\s+const\s+abby\s+=\s+\{[^}]*\};)/;

  const updatedContent = configFileString.replace(
    existingObjectRegex,
    updatedConfig
  );

  const fileName = "src/abby2.ts";
  fs.writeFile(fileName, updatedContent, (error) => {
    if (error) {
      console.error(error);
      return;
    }
    console.log("Config File updated");
  });
}

export function getConfigFromFileString(configFileString: string): AbbyConfig {
  const regexAngular = /export const abby = ({[\s\S]*?});/;
  const regexNext = /createAbby\(({[\s\S]+?})\);/;
  const regexReact = /createAbby\(({[\s\S]+?})\);/;
  const regexSvelte = /createAbby\(({[\s\S]+?})\);/;

  const regexes: RegExp[] = [
      regexAngular, regexReact, regexNext, regexSvelte
  ]

  let matchedRegex: RegExp | null = null;

  for (const regex of regexes) {
    if (regex.test(configFileString)) {
      matchedRegex = regex;
    }
  }

  if (matchedRegex) {
    console.log("Regex found successfully");
    const match = configFileString.match(matchedRegex);
    const objectString = match ? match[1] : "";
    const object = eval("(" + objectString + ")");
    return object as AbbyConfig;
  } else {
    return {} as AbbyConfig
  }
}
