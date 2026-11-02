import {
  type StorageServiceOptions,
  getABStorageKey,
  getFFStorageKey,
  getRCStorageKey,
} from "@tryabby/core";

export function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

/** A cookie failure must never prevent a component from rendering. */
export function readCookies(): Map<string, string> {
  const result = new Map<string, string>();
  if (!isBrowser()) return result;
  try {
    for (const part of document.cookie.split(";")) {
      const separator = part.indexOf("=");
      if (separator < 0) continue;
      try {
        const key = decodeURIComponent(part.slice(0, separator).trim());
        const value = decodeURIComponent(part.slice(separator + 1));
        result.set(key, value);
      } catch {
        // Ignore an individually malformed cookie, not every valid cookie.
      }
    }
  } catch {
    // Sandboxed frames and blocked storage can throw from document.cookie.
  }
  return result;
}

function writeCookie(key: string, value: string, expiresInDays: number): void {
  if (!isBrowser()) return;
  try {
    const expiry = new Date(Date.now() + expiresInDays * 86_400_000);
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; Path=/; Expires=${expiry.toUTCString()}; SameSite=Lax${secure}`;
  } catch {
    // The in-memory assignment remains usable when browser storage is blocked.
  }
}

export type CookieSettings = {
  disableByDefault?: boolean;
  expiresInDays?: number;
};

export function createStorage(
  projectId: string,
  settings: () => CookieSettings | undefined,
  mounted: () => boolean
) {
  const assignments = new Map<string, string>();
  const expiry = (options?: StorageServiceOptions) => {
    const days = options?.expiresInDays ?? settings()?.expiresInDays ?? 365;
    return Number.isFinite(days) && days > 0 ? days : 365;
  };
  const enabled = () => mounted() && !settings()?.disableByDefault;
  const remove = (key: string) => {
    if (mounted()) writeCookie(key, "", -1);
  };
  const adapter = (keyFor: (project: string, name: string) => string) => ({
    get(name: string): string | null {
      const key = keyFor(projectId, name);
      if (enabled()) {
        const cookie = readCookies().get(key);
        if (cookie !== undefined) return cookie;
      }
      const assignment = assignments.get(key);
      if (assignment !== undefined && enabled()) {
        // Retry persistence if a mounted assignment was held only in memory.
        writeCookie(key, assignment, expiry());
      }
      return assignment ?? null;
    },
    set(name: string, value: string, options?: StorageServiceOptions) {
      // Core's synchronous SSR/setup snapshots may sample a provisional value.
      // Only a mounted client can establish an assignment using final weights.
      if (!mounted()) return;
      const key = keyFor(projectId, name);
      assignments.set(key, value);
      if (enabled()) writeCookie(key, value, expiry(options));
    },
  });
  return {
    tests: adapter(getABStorageKey),
    flags: adapter(getFFStorageKey),
    remoteConfig: adapter(getRCStorageKey),
    resetTest(name: string) {
      const key = getABStorageKey(projectId, name);
      assignments.delete(key);
      remove(key);
    },
    clear(names: { tests: string[]; flags: string[]; remoteConfig: string[] }) {
      assignments.clear();
      for (const name of names.tests) remove(getABStorageKey(projectId, name));
      for (const name of names.flags) remove(getFFStorageKey(projectId, name));
      for (const name of names.remoteConfig)
        remove(getRCStorageKey(projectId, name));
    },
    consent(enabledValue: boolean) {
      if (mounted()) {
        writeCookie(
          getABStorageKey(projectId, "$_abcc_$"),
          String(enabledValue),
          expiry()
        );
      }
    },
  };
}
