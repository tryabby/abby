import {
  type IStorageService,
  type StorageServiceOptions,
  getABStorageKey,
  getFFStorageKey,
  getRCStorageKey,
} from "@tryabby/core";
import Cookie from "js-cookie";

const DEFAULT_COOKIE_AGE = 365;

class ABStorageService implements IStorageService {
  get(projectId: string, testName: string): string | null {
    const retrievedValue = Cookie.get(getABStorageKey(projectId, testName));
    return retrievedValue || null;
  }

  set(
    projectId: string,
    testName: string,
    value: string,
    options?: StorageServiceOptions
  ): void {
    Cookie.set(getABStorageKey(projectId, testName), value, {
      expires: options?.expiresInDays
        ? options.expiresInDays
        : DEFAULT_COOKIE_AGE,
    });
  }

  remove(projectId: string, testName: string): void {
    Cookie.remove(getABStorageKey(projectId, testName));
  }
}

class FFStorageService implements IStorageService {
  get(projectId: string, flagName: string): string | null {
    return Cookie.get(getFFStorageKey(projectId, flagName)) || null;
  }

  set(projectId: string, flagName: string, value: string): void {
    Cookie.set(getFFStorageKey(projectId, flagName), value, {
      expires: DEFAULT_COOKIE_AGE,
    });
  }

  remove(projectId: string, flagName: string): void {
    Cookie.remove(getFFStorageKey(projectId, flagName));
  }
}

class RCStorageService implements IStorageService {
  get(projectId: string, configName: string): string | null {
    return Cookie.get(getRCStorageKey(projectId, configName)) || null;
  }

  set(projectId: string, configName: string, value: string): void {
    Cookie.set(getRCStorageKey(projectId, configName), value, {
      expires: DEFAULT_COOKIE_AGE,
    });
  }

  remove(projectId: string, configName: string): void {
    Cookie.remove(getRCStorageKey(projectId, configName));
  }
}

export const TestStorageService = new ABStorageService();
export const FlagStorageService = new FFStorageService();
export const RemoteConfigStorageService = new RCStorageService();
