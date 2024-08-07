import type { Context } from "hono";

export type CacheConfig = {
  /**
   * How long an entry should be fresh in milliseconds
   */
  fresh: number;

  /**
   * How long an entry should be stale in milliseconds
   *
   * Stale entries are still valid but should be refreshed in the background
   */
  stale: number;
};

export type Entry<TValue> = {
  value: TValue;
};

export type ZoneCacheConfig = CacheConfig & {
  domain: string;
  zoneId: string;
  /**
   * This token must have at least
   */
  cloudflareApiKey: string;
};

export class ZoneCache<TNamespaces extends Record<string, unknown>> {
  private readonly config: ZoneCacheConfig;

  constructor(config: ZoneCacheConfig) {
    this.config = config;
  }

  private createCacheKey<TName extends keyof TNamespaces>(
    namespace: TName,
    key: string,
    cacheBuster = "v1"
  ): URL {
    return new URL(
      `https://${this.config.domain}/cache/${cacheBuster}/${String(namespace)}/${key}`
    );
  }

  public async get<TName extends keyof TNamespaces>(
    _c: Context,
    namespace: TName,
    key: string
  ): Promise<
    [TNamespaces[TName] | undefined, "stale" | "hit" | "miss" | "error"]
  > {
    try {
      const res = await caches.default.match(
        new Request(this.createCacheKey(namespace, key))
      );
      if (!res) {
        return [undefined, "miss"];
      }
      const entry = (await res.json()) as Entry<TNamespaces[TName]>;

      return [entry.value, "hit"];
    } catch (e) {
      console.error("zone cache error:", e);
      return [undefined, "error"];
    }
  }

  public async set<TName extends keyof TNamespaces>(
    _c: Context,
    namespace: TName,
    key: string,
    value: TNamespaces[TName] | null
  ): Promise<void> {
    const entry: Entry<TNamespaces[TName] | null> = {
      value: value,
    };
    const req = new Request(this.createCacheKey(namespace, key));
    const res = new Response(JSON.stringify(entry), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=60",
      },
    });

    await caches.default.put(req, res);
  }
}
