import type { AbbyConfigFile, AbbyDataResponse } from "@tryabby/core";
import createCache from "./memory-cache";

const configCache = createCache<string, AbbyDataResponse>({
  name: "configCache",
  // expire after 24 hours
  expireAfterMilliseconds: 1000 * 60 * 60 * 24,
});

type ConfigCacheKey = {
  environment: string;
  projectId: string;
  apiVersion: NonNullable<AbbyConfigFile["experimental"]>["apiVersion"];
};

export abstract class ConfigCache {
  private static getCacheKey({
    apiVersion,
    environment,
    projectId,
  }: ConfigCacheKey) {
    return [projectId, environment, apiVersion].join(":");
  }
  static getConfig(opts: ConfigCacheKey) {
    return configCache.get(ConfigCache.getCacheKey(opts));
  }

  static setConfig({
    value,
    ...opts
  }: ConfigCacheKey & {
    value: AbbyDataResponse;
  }) {
    configCache.set(ConfigCache.getCacheKey(opts), value);
  }

  static deleteConfig(opts: Omit<ConfigCacheKey, "apiVersion">) {
    const apiVersionsToClear: Array<ConfigCacheKey["apiVersion"]> = [
      "v1",
      "v2",
    ];
    for (const apiVersion of apiVersionsToClear) {
      configCache.delete(ConfigCache.getCacheKey({ ...opts, apiVersion }));
    }
  }
}
