import { AbbyConfig } from "@tryabby/core";
import * as fs from "fs";
import { Framework, Frameworks } from "./types";

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

export function getRegex(configFileString: string) {
  const regexAngular = /export const abby = ({[\s\S]*?});/;
  const regexNext = /createAbby\(({[\s\S]+?})\);/;
  const regexReact = /createAbby\(({[\s\S]+?})\);/;
  const regexSvelte = /createAbby\(({[\s\S]+?})\);/;

  const regexes: RegExp[] = [regexAngular, regexReact, regexNext, regexSvelte];

  let matchedRegex: RegExp | null = null;

  for (const regex of regexes) {
    if (regex.test(configFileString)) {
      matchedRegex = regex;
    }
  }
  return matchedRegex;
}

export function getFramework(configFileString: string): Framework | null {
  const frameworks = [
    {
      framework: Frameworks.Angular,
      regex: /export const abby = ({[\s\S]*?});/,
      replaceRegex: /(?<=export const abby = )\{[\s\S]*?\};/,
    },
    {
      framework: Frameworks.React,
      regex: /createAbby\(({[\s\S]+?})\);/,
      replaceRegex: /(?<=createAbby\(({[\s\S]+?})\);)/,
    },
    {
      framework: Frameworks.NextJs,
      regex: /createAbby\(({[\s\S]+?})\);/,
      replaceRegex: /(?<=createAbby\(({[\s\S]+?})\);)/,
    },
    {
      framework: Frameworks.Svelte,
      regex: /createAbby\(({[\s\S]+?})\);/,
      replaceRegex: /(?<=createAbby\(({[\s\S]+?})\);)/,
    },
  ];

  let matchedFramework: Framework | null = null;

  for (const framework of frameworks) {
    if (framework.regex.test(configFileString)) {
      matchedFramework = framework;
    }
  }

  return matchedFramework;
}

export function getConfigFromFileString(configFileString: string): AbbyConfig {
  let framework = getFramework(configFileString);

  if (framework) {
    const match = configFileString.match(framework.regex);
    const objectString = match ? match[1] : "";
    const object = eval("(" + objectString + ")");
    return object as AbbyConfig;
  } else {
    return {} as AbbyConfig;
  }
}

export function getParsedJSONString(object: any): string {
  const string = JSON.stringify(object, null, 2);
  return string.replace(/"([^"]+)":/g, "$1:");
}
