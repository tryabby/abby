import { HttpService } from "./http";
import { loadLocalConfig } from "./util";

export async function check({
  apiKey,
  apiUrl,
  configPath,
}: {
  apiKey: string;
  apiUrl?: string;
  configPath?: string;
}) {
  const { config: localConfig } = await loadLocalConfig(configPath);

  const remoteConfig = await HttpService.getConfigFromServer({
    projectId: localConfig.projectId,
    apiKey,
    apiUrl,
  });

  const invalidTests = Object.keys(remoteConfig.tests ?? {}).filter((key) => {
    return (
      localConfig.tests[key] == undefined &&
      localConfig.tests[key] != (remoteConfig.tests ?? {})[key]
    );
  });

  const invalidFlags = Object.keys(remoteConfig.flags ?? {}).filter((key) => {
    return (
      localConfig.flags[key] == undefined &&
      localConfig.flags[key] != (remoteConfig.flags ?? {})[key]
    );
  });

  return {
    isValid: invalidTests.length === 0 && invalidFlags.length === 0,
    invalidTests,
    invalidFlags,
  };
}
