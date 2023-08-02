import { HttpService } from "./http";
import { loadLocalConfig } from "./util";

export async function push({
  apiKey,
  apiUrl,
  configPath,
}: {
  apiKey: string;
  apiUrl?: string;
  configPath?: string;
}) {
  const { config } = await loadLocalConfig(configPath);

  const projectId = config.projectId;
  await HttpService.updateConfigOnServer({
    projectId,
    apiKey,
    localAbbyConfig: config,
    apiUrl,
  });
}
