import {
  getABStorageKey,
  getFFStorageKey,
  getRCStorageKey,
  type IStorageService,
} from "@tryabby/core";
import Cookie from "js-cookie";

class ABStorageService implements IStorageService {
  get(projectId: string, testName: string): string | null {
    const retrievedValue = Cookie.get(getABStorageKey(projectId, testName));
    if (!retrievedValue) return null;

    return retrievedValue;
  }

  set(projectId: string, testName: string, value: string): void {
    Cookie.set(getABStorageKey(projectId, testName), value);
  }

  remove(projectId: string, testName: string): void {
    Cookie.remove(getABStorageKey(projectId, testName));
  }
}

class FFStorageService implements IStorageService {
  get(projectId: string, flagName: string): string | null {
    const retrievedValue = Cookie.get(getFFStorageKey(projectId, flagName));
    if (!retrievedValue) return null;

    return retrievedValue;
  }

  set(projectId: string, flagName: string, value: string): void {
    Cookie.set(getFFStorageKey(projectId, flagName), value);
  }

  remove(projectId: string, flagName: string): void {
    Cookie.remove(getFFStorageKey(projectId, flagName));
  }
}

class RCStorageService implements IStorageService {
  get(projectId: string, key: string): string {
    const retrievedValue = Cookie.get(getRCStorageKey(projectId, key));
    return retrievedValue ?? null;
  }
  set(projectId: string, key: string, value: string): void {
    Cookie.set(getRCStorageKey(projectId, key), value);
  }
  remove(projectId: string, key: string): void {
    Cookie.remove(getRCStorageKey(projectId, key));
  }
}

export const TestStorageService = new ABStorageService();
export const FlagStorageService = new FFStorageService();
export const RemoteConfigStorageService = new RCStorageService();
