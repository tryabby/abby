import { redis } from "server/db/redis";

export abstract class RequestCache {
  private static getCacheKey(projectId: string) {
    return `requests:${projectId}:`;
  }

  static async increment(projectId: string) {
    return redis.incr(RequestCache.getCacheKey(projectId));
  }

  static async get(projectId: string) {
    return Number(await redis.get(RequestCache.getCacheKey(projectId)));
  }

  static async reset(projectId: string | string[]) {
    return redis.del(
      new Array<string>()
        .concat(projectId)
        .map((id) => RequestCache.getCacheKey(id))
    );
  }
}
