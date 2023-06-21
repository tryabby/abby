import { createFlag, createTest, getConfig } from "./http";
import { getConfigFromFileString, loadLocalConfig } from "./util";

export async function push() {
  const localConfigString = await loadLocalConfig();
  const localAbbyConfig = getConfigFromFileString(localConfigString);
  const projectId = localAbbyConfig.projectId;

  const serverConfigData = await getConfig(projectId);

  for (const test in localAbbyConfig.tests) {
    if (!serverConfigData.tests[test]) {
      createTest(projectId);
      console.log(test + " test added");
      // update test
    }
  }
  if (localAbbyConfig.flags) {
    for (const flag of localAbbyConfig.flags) {
      if (!serverConfigData.flags.includes(flag)) {
        createFlag(projectId, flag);
        console.log(flag + " flag added");
      }
    }
  }

  console.log("pushed successfully");
}
