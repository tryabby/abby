import Redis from 'ioredis'

import { env } from '../../env/server.mjs'

declare global {
  // eslint-disable-next-line no-var
  var redis: Redis | undefined
}

export const redis = global.redis || new Redis(env.REDIS_URL)

if (env.NODE_ENV !== 'production') {
  global.redis = redis
}
