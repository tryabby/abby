import chalk from "chalk";
import { HttpService } from "./http";
import { loadLocalConfig } from "./util";

export async function check(apiKey: string, localhost?: boolean): Promise<boolean> {
  const { config: localConfig } = await loadLocalConfig();

  const remoteConfig = await HttpService.getConfigFromServer(
    localConfig.projectId,
    apiKey,
    localhost
  );

  let testsUpToDate = true;
  let flagsUpToDate = true;

  let output = false;

  if (remoteConfig && localConfig) {
    if (remoteConfig.tests && localConfig.tests) {
      for (let serverTest in remoteConfig.tests) {
        if (!(serverTest in localConfig.tests)) {
          testsUpToDate = false;
        }
      }
      for (let localTest in localConfig.tests) {
        if (!(localTest in remoteConfig.tests)) {
          testsUpToDate = false;
        }
      }
    } else if (remoteConfig.tests || localConfig.tests) testsUpToDate = false;

    if (remoteConfig.flags && localConfig.flags) {
      if (!(remoteConfig.flags != localConfig.flags)) flagsUpToDate = false;
    } else if (remoteConfig.flags || localConfig.flags) flagsUpToDate = false;

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
    console.log(chalk.red("Something went wrong. Please check your login"));
    return false;
  }
}
