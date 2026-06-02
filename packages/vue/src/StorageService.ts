import {
  type IStorageService,
  type StorageServiceOptions,
  getABStorageKey,
  getFFStorageKey,
  getRCStorageKey,
} from "@tryabby/core";
import Cookie from "js-cookie";

const DEFAULT_COOKIE_AGE = 365;

class CookieStorageService implements IStorageService {
  constructor(
    private readonly getKey: (projectId: string, name: string) => string
  ) {}

  get(projectId: string, name: string): string | null {
    return Cookie.get(this.getKey(projectId, name)) ?? null;
  }

  set(
    projectId: string,
    name: string,
    value: string,
    options?: StorageServiceOptions
  ): void {
    Cookie.set(this.getKey(projectId, name), value, {
      expires: options?.expiresInDays ?? DEFAULT_COOKIE_AGE,
    });
  }

  remove(projectId: string, name: string): void {
    Cookie.remove(this.getKey(projectId, name));
  }
}

export const TestStorageService = new CookieStorageService(getABStorageKey);
export const FlagStorageService = new CookieStorageService(getFFStorageKey);
export const RemoteConfigStorageService = new CookieStorageService(
  getRCStorageKey
);
