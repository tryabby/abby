import { zValidator } from "@hono/zod-validator";
import { abbyEventSchema } from "@tryabby/core";
import { Hono } from "hono";

import isbot from "isbot";
import { checkRateLimit } from "server/common/ratelimit";
import { eventQueue } from "server/queue/queues";

export function makeEventRoute() {
  const app = new Hono().post(
    "/",
    zValidator("json", abbyEventSchema),
    async (c) => {
      const userAgent = c.req.header("user-agent");
      const now = performance.now();
      // filter out bot users
      if (isbot(userAgent)) {
        return c.text("Forbidden", 403);
      }

      const event = c.req.valid("json");

      let clientIp = (c.req.header("x-forwarded-for") || "")
        .split(",")
        .pop()
        ?.trim();

      if (process.env.NODE_ENV === "development") {
        clientIp = "127.0.0.1";
      }

      try {
        //   // we only want to rate limit in production
        if (process.env.NODE_ENV === "production") {
          // Create a new ratelimiter, that allows 10 requests per 10 seconds

          if (!clientIp) {
            console.error("Unable to get client IP");

            return c.text("Internal Server Error", 500);
          }

          const success = await checkRateLimit(clientIp);

          if (!success) {
            return c.text("Too Many Requests", 429);
          }
        }

        const duration = performance.now() - now;

        const userAgent = c.req.header("user-agent");
        if (!userAgent || !clientIp) {
          return c.text("Bad Request", 400);
        }

        eventQueue.add("event", {
          ...event,
          functionDuration: duration,
          ipAddress: clientIp,
          userAgent,
        });

        return c.text("OK", 200);
      } catch (err) {
        console.error(err);
        return c.text("Internal Server Error", 500);
      }
    }
  );

  return app;
}
