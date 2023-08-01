import { HttpService } from "./http";
import { loadLocalConfig } from "./util";

export async function push({ apiKey, localhost }: { apiKey: string; localhost?: boolean }) {
  const { config } = await loadLocalConfig();

  const projectId = config.projectId;
  await HttpService.updateConfigOnServer(projectId, apiKey, config, localhost);
}
