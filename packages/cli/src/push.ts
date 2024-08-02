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
  const { config } = await loadLocalConfig({ configPath });

  await HttpService.updateConfigOnServer({
    apiKey,
    localAbbyConfig: config,
    apiUrl,
  });
}
