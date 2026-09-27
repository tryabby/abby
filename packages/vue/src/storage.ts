import {
  type StorageServiceOptions,
  getABStorageKey,
  getFFStorageKey,
  getRCStorageKey,
} from "@tryabby/core";
import Cookies from "js-cookie";

export function createStorage(
  projectId: string,
  storageKey: typeof getABStorageKey
) {
  return {
    get(key: string) {
      if (typeof document === "undefined") return null;
      return Cookies.get(storageKey(projectId, key)) ?? null;
    },
    set(key: string, value: string, options?: StorageServiceOptions) {
      if (typeof document === "undefined") return;
      Cookies.set(storageKey(projectId, key), value, {
        expires: options?.expiresInDays ?? 365,
      });
    },
    remove(key: string) {
      if (typeof document !== "undefined") {
        Cookies.remove(storageKey(projectId, key));
      }
    },
  };
}

export { getABStorageKey, getFFStorageKey, getRCStorageKey };
