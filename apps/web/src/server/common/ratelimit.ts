import { RateLimiterRedis } from "rate-limiter-flexible";
import { redis } from "server/db/redis";

export const rateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "rateLimiter",
  points: 10, // Number of points
  duration: 10, // Per 10 seconds
});

export const checkRateLimit = async (ip: string) => {
  try {
    await rateLimiter.consume(ip);
    return true;
  } catch (_rateLimiterRes) {
    return false;
  }
};
