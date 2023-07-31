import { HttpService } from "./http";
import { getConfigFromFileString, loadLocalConfig } from "./util";
import { AbbyConfig } from "@tryabby/core";

export async function check(
  filepath: string,
  apiKey: string,
  localhost?: boolean,
): Promise<boolean> {
  const configFileString: string = await loadLocalConfig(filepath);
  const configFromFile: AbbyConfig = getConfigFromFileString(configFileString);

  const configFromAbby = (await HttpService.getConfigFromServer(
    configFromFile.projectId,
    apiKey,
    localhost,
  )) as AbbyConfig;

  let testsUpToDate = true;
  let flagsUpToDate = true;

  let output = false;

  if (configFromAbby && configFromFile) {
    if (configFromAbby.tests && configFromFile.tests) {
      for (let serverTest in configFromAbby.tests) {
        if (!(serverTest in configFromFile.tests)) {
          testsUpToDate = false;
        }
      }
      for (let localTest in configFromFile.tests) {
        if (!(localTest in configFromAbby.tests)) {
          testsUpToDate = false;
        }
      }
    } else if (configFromAbby.tests || configFromFile.tests)
      testsUpToDate = false;

    if (configFromAbby.flags && configFromFile.flags) {
      if (!(configFromAbby.flags != configFromFile.flags))
        flagsUpToDate = false;
    } else if (configFromAbby.flags || configFromFile.flags)
      flagsUpToDate = false;

    if (testsUpToDate && flagsUpToDate) {
      output = true;
      console.log("all tests are up to date");
    } else {
      if (!testsUpToDate) {
        output = false;
        console.log("tests are not up to date");
      }
      if (!flagsUpToDate) {
        output = false;
        console.log("flags are not up to date");
      }
    }
    return output;
  } else {
    console.log("Something went wrong. Please check your login");
    return false;
  }
}
