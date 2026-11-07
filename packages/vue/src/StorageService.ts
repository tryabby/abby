import {
  ABBY_AB_STORAGE_PREFIX,
  ABBY_FF_STORAGE_PREFIX,
  ABBY_RC_STORAGE_PREFIX,
  type StorageServiceOptions,
} from "@tryabby/core";
import Cookies from "js-cookie";

export interface StorageKeyRef {
  prefix: string;
  projectId: string;
  key: string;
}

export interface StorageWriteRequest extends StorageKeyRef {
  value: string;
  options?: StorageServiceOptions;
}

// Formats a scoped cookie key for browser persistence of Abby variants and overrides.
function formatCookieKey(ref: StorageKeyRef): string {
  return `${ref.prefix}_${ref.projectId}:${ref.key}`;
}

// Reads a scoped cookie value or returns null when absent.
function readScopedCookie(ref: StorageKeyRef): string | null {
  return Cookies.get(formatCookieKey(ref)) ?? null;
}

// Writes a scoped cookie with a configurable day-based expiration window.
function writeScopedCookie(req: StorageWriteRequest): void {
  Cookies.set(formatCookieKey(req), req.value, {
    expires: req.options?.expiresInDays ?? 365,
  });
}

// Removes a scoped cookie entry from the browser jar.
function removeScopedCookie(ref: StorageKeyRef): void {
  Cookies.remove(formatCookieKey(ref));
}

// Persists A/B test variant assignments in browser cookies scoped by project and test key.
export const TestStorageService = {
  get(ref: Omit<StorageKeyRef, "prefix">): string | null {
    return readScopedCookie({ ...ref, prefix: ABBY_AB_STORAGE_PREFIX });
  },
  set(req: Omit<StorageWriteRequest, "prefix">): void {
    writeScopedCookie({ ...req, prefix: ABBY_AB_STORAGE_PREFIX });
  },
  remove(ref: Omit<StorageKeyRef, "prefix">): void {
    removeScopedCookie({ ...ref, prefix: ABBY_AB_STORAGE_PREFIX });
  },
};

// Persists local development feature flag overrides in browser cookies.
export const FlagStorageService = {
  get(ref: Omit<StorageKeyRef, "prefix">): string | null {
    return readScopedCookie({ ...ref, prefix: ABBY_FF_STORAGE_PREFIX });
  },
  set(req: Omit<StorageWriteRequest, "prefix">): void {
    writeScopedCookie({ ...req, prefix: ABBY_FF_STORAGE_PREFIX });
  },
  remove(ref: Omit<StorageKeyRef, "prefix">): void {
    removeScopedCookie({ ...ref, prefix: ABBY_FF_STORAGE_PREFIX });
  },
};

// Persists local development remote configuration overrides in browser cookies.
export const RemoteConfigStorageService = {
  get(ref: Omit<StorageKeyRef, "prefix">): string | null {
    return readScopedCookie({ ...ref, prefix: ABBY_RC_STORAGE_PREFIX });
  },
  set(req: Omit<StorageWriteRequest, "prefix">): void {
    writeScopedCookie({ ...req, prefix: ABBY_RC_STORAGE_PREFIX });
  },
  remove(ref: Omit<StorageKeyRef, "prefix">): void {
    removeScopedCookie({ ...ref, prefix: ABBY_RC_STORAGE_PREFIX });
  },
};
