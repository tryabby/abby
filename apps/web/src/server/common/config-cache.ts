import { AbbyDataResponse } from "@tryabby/core";
import createCache from "./memory-cache";

const configCache = createCache<string, AbbyDataResponse>({
  name: "configCache",
  // expire after 24 hours
  expireAfterMilliseconds: 1000 * 60 * 60 * 24,
});

type ConfigCacheKey = {
  environment: string;
  projectId: string;
};

export abstract class ConfigCache {
  static getConfig({ environment, projectId }: ConfigCacheKey) {
    return configCache.get(projectId + environment);
  }

  static setConfig({
    environment,
    projectId,
    value,
  }: ConfigCacheKey & {
    value: AbbyDataResponse;
  }) {
    configCache.set(projectId + environment, value);
  }

  static deleteConfig({ environment, projectId }: ConfigCacheKey) {
    configCache.delete(projectId + environment);
  }
}
