import * as fs from 'fs/promises';
import { AbbyConfig, PullAbbyConfigResponse } from '@tryabby/core';
import { loadLocalConfig } from './util';
import { HttpService } from './http';
import deepmerge from 'deepmerge';
import { updateConfigFile } from './update-config-file';

export function mergeConfigs(localConfig: AbbyConfig, remoteConfig: PullAbbyConfigResponse) {
  return {
    ...localConfig,
    environments: Array.from(new Set([...localConfig.environments, ...remoteConfig.environments])),
    tests: deepmerge(localConfig.tests ?? {}, remoteConfig.tests ?? {}),
    flags: deepmerge(localConfig.flags ?? [], remoteConfig.flags ?? []),
    remoteConfig: deepmerge(localConfig.remoteConfig ?? {}, remoteConfig.remoteConfig ?? {}),
  } satisfies AbbyConfig;
}

export async function pullAndMerge({
  apiKey,
  apiUrl,
  configPath,
}: {
  apiKey: string;
  apiUrl?: string;
  configPath?: string;
}): Promise<void> {
  const { config: localConfig, configFilePath } = await loadLocalConfig(configPath);

  const configFileContents = await fs.readFile(configFilePath, 'utf-8');

  const remoteConfig = await HttpService.getConfigFromServer({
    projectId: localConfig.projectId,
    apiKey,
    apiUrl,
  });

  if (remoteConfig) {
    const updatedConfig = mergeConfigs(localConfig, remoteConfig);
    await updateConfigFile(updatedConfig, configFileContents, configFilePath);
  } else {
    console.error('Config in file not found');
  }
}
