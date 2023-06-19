import * as path from "path";
import * as fs from "fs";
import { AbbyConfig } from "@tryabby/core";

type ABConfig<T extends string = string> = {
  variants: ReadonlyArray<T>;
};

type Tests<TestName extends string = string> = Record<TestName, ABConfig>;

type ConfigData<FlagName extends string = string> = {
  tests: Tests;
  flags: FlagName[];
};

function loadAbbyConfig(): Promise<string> {
  // TODO search for file. it just works, when the file is in root
  return new Promise<string>((resolve, reject) => {
    const fileName = "src/abby.ts";

    fs.readFile(fileName, "utf8", (error, data) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(data);
    });
  });
}

function getConfig(configFileString: string): AbbyConfig {
  const regex = /export const abby = ({[\s\S]*?});/;

  const match = configFileString.match(regex);
  const objectString = match ? match[1] : "";
  const object = eval("(" + objectString + ")");
  return object as AbbyConfig;
}

async function getConfigFromAbby(projectId: string): Promise<ConfigData> {
  let tests: Tests = {};
  let flags = [];
  const response = await fetch(
    `http://www.tryabby.com/api/dashboard/${projectId}/data`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const responseJson = await response.json();

  for (const test of responseJson.tests) {
    tests[test.name] = { variants: ["A", "B", "C"] };
  }
  for (const flag of responseJson.flags) {
    flags.push(flag.name);
  }

  const config: ConfigData = { tests, flags };

  return config;
}

async function updateConfig(
  configFromFile: AbbyConfig,
  configFromAbby: ConfigData
): Promise<Object> {
  console.log(configFromFile.projectId);
  //console.log(configFromAbby);

  const newConfig: Omit<AbbyConfig, "flags"> & { flags: string[] } = {
    projectId: configFromFile.projectId,
    currentEnvironment: configFromFile.currentEnvironment,
    tests: configFromAbby.tests ?? configFromFile.tests,
    flags: configFromAbby.flags ?? configFromFile.flags,
  };

  console.log(newConfig);

  const updatedConfigString = JSON.stringify(newConfig, null, 2);

  const fileName = "src/abby.ts";

  //   fs.writeFile(fileName, updatedConfigString, (error) => {
  //     if (error) {
  //       console.error(error);
  //       return;
  //     }
  //     console.log("Config updated");
  //   });

  return newConfig;
}

export async function main(): Promise<void> {
  const configFileString: string = await loadAbbyConfig();
  const configFromFile: AbbyConfig = getConfig(configFileString);

  const configFromAbby = await getConfigFromAbby("clftg3tzd0004l7085yktpsov");

  const updatedConfig = updateConfig(configFromFile, configFromAbby);

  // const updatedConfig = getConfigFromAbby(projectId);
}
