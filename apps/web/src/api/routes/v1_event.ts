import { zValidator } from "@hono/zod-validator";
import { abbyEventSchema, AbbyEventType } from "@tryabby/core";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { Hono } from "hono";

import isbot from "isbot";
import { EventService } from "server/services/EventService";
import { RequestCache } from "server/services/RequestCache";
import { RequestService } from "server/services/RequestService";

export function makeEventRoute() {
  const app = new Hono().post(
    "/",
    zValidator("json", abbyEventSchema),
    async (c) => {
      const now = performance.now();
      // filter out bot users
      if (isbot(c.req.header("user-agent"))) {
        return c.text("Forbidden", 403);
      }

      const event = c.req.valid("json");

      try {
        //   // we only want to rate limit in production
        if (process.env.NODE_ENV === "production") {
          // Create a new ratelimiter, that allows 10 requests per 10 seconds
          const ratelimit = new Ratelimit({
            redis: Redis.fromEnv(),
            limiter: Ratelimit.slidingWindow(10, "10 s"),
          });

          const clientIp = (c.req.header("x-forwarded-for") || "")
            .split(",")
            .pop()
            ?.trim();

          if (!clientIp) {
            console.error("Unable to get client IP");

            return c.text("Internal Server Error", 500);
          }

          const { success } = await ratelimit.limit(clientIp);

          if (!success) {
            return c.text("Too Many Requests", 429);
          }
        }

        const duration = performance.now() - now;

        // TODO: add those to a queue and process them in a background job as they are not critical
        switch (event.type) {
          case AbbyEventType.PING:
          case AbbyEventType.ACT: {
            await EventService.createEvent(event);
            break;
          }
          default: {
            event.type satisfies never;
          }
        }

        await RequestCache.increment(event.projectId);
        await RequestService.storeRequest({
          projectId: event.projectId,
          type: "TRACK_VIEW",
          durationInMs: duration,
          apiVersion: "V1",
        }).catch((e) => {
          console.error("Unable to store request", e);
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
