import { AbbyDataResponse, HttpService } from "@tryabby/core";

import type { ZoneCache } from "./cache";
import { Context } from "hono";
import { endTime, startTime } from "hono/timing";

export class ConfigService {
  constructor(
    private readonly cache: ZoneCache<{
      config: AbbyDataResponse;
    }>
  ) {}

  async retrieveConfig({
    environment,
    projectId,
    c,
  }: {
    projectId: string;
    environment: string;
    c: Context;
  }) {
    const cacheKey = [projectId, environment].join(",");

    startTime(c, "cacheRead");
    const [cachedData, reason] = await this.cache.get(c, "config", cacheKey);

    endTime(c, "cacheRead");

    if (cachedData) {
      return [cachedData, true, reason] as const;
    }

    startTime(c, "remoteRead");

    const data = await HttpService.getProjectData({
      projectId,
      environment,
    });

    if (!data) {
      throw new Error("Failed to fetch data");
    }

    endTime(c, "remoteRead");
    c.executionCtx.waitUntil(this.cache.set(c, "config", cacheKey, data));

    return [data, false, reason] as const;
  }
}
