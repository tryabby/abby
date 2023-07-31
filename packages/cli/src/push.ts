import { HttpService } from "./http";
import { getConfigFromFileString, loadLocalConfig } from "./util";

export async function push(
  filePath: string,
  apiKey: string,
  localhost?: boolean,
): Promise<void> {
  const localConfigString = await loadLocalConfig(filePath);
  const localAbbyConfig = getConfigFromFileString(localConfigString);
  const projectId = localAbbyConfig.projectId;
  await HttpService.updateConfigOnServer(
    projectId,
    apiKey,
    localAbbyConfig,
    localhost,
  );
}
