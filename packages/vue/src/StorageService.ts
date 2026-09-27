import {
  type IStorageService,
  type StorageServiceOptions,
  getABStorageKey,
  getFFStorageKey,
  getRCStorageKey,
} from "@tryabby/core";
import Cookie from "js-cookie";

const DEFAULT_COOKIE_AGE = 365;

/**
 * Returns true if we are running in an environment with a browser and
 * therefore can read and write cookies. This is false on the server (SSR),
 * during prerendering and in edge runtimes.
 */
export const isBrowser = () =>
  typeof window !== "undefined" && typeof document !== "undefined";

class CookieStorageService implements IStorageService {
  constructor(
    private readonly getKey: (projectId: string, name: string) => string
  ) {}

  get(projectId: string, name: string): string | null {
    if (!isBrowser()) return null;

    // biome-ignore lint/style/noNonNullAssertion: we checked that we are in a browser
    return Cookie.get(this.getKey(projectId, name)!) ?? null;
  }

  set(
    projectId: string,
    name: string,
    value: string,
    options?: StorageServiceOptions
  ): void {
    if (!isBrowser()) return;

    Cookie.set(this.getKey(projectId, name), value, {
      // the nullish coalescing is important here: an explicit `0` (session
      // cookie) must not fall back to the default expiration
      expires: options?.expiresInDays ?? DEFAULT_COOKIE_AGE,
    });
  }

  remove(projectId: string, name: string): void {
    if (!isBrowser()) return;

    Cookie.remove(this.getKey(projectId, name));
  }
}

export const TestStorageService = new CookieStorageService(getABStorageKey);
export const FlagStorageService = new CookieStorageService(getFFStorageKey);
export const RemoteConfigStorageService = new CookieStorageService(
  getRCStorageKey
);
