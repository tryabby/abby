import Redis from "ioredis";

import { env } from "../../env/server.mjs";

declare global {
  var redis: Redis | undefined;
}

// biome-ignore lint/suspicious/noRedeclare:>
export const redis = global.redis || new Redis(env.REDIS_URL);

if (env.NODE_ENV !== "production") {
  global.redis = redis;
}
