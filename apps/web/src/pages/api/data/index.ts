import { NextApiRequest, NextApiResponse } from "next";
import { EventService } from "server/services/EventService";
import { AbbyEventType, abbyEventSchema } from "@tryabby/core";
import NextCors from "nextjs-cors";
import isBot from "isbot";

import { Ratelimit } from "@upstash/ratelimit"; // for deno: see above
import { Redis } from "@upstash/redis";
import { RequestCache } from "server/services/RequestCache";
import { RequestService } from "server/services/RequestService";

export default async function incomingDataHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const now = performance.now();
  await NextCors(req, res, {
    methods: ["POST"],
    origin: "*",
    optionsSuccessStatus: 200,
  });

  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  // filter out bot users
  if (isBot(req.headers["user-agent"] as string)) {
    res.status(403).end();
    return;
  }

  const bodySchemaResult = abbyEventSchema.safeParse(req.body);
  if (!bodySchemaResult.success) {
    res.status(400).end();
    return;
  }

  const event = bodySchemaResult.data;

  try {
    // we only want to rate limit in production
    if (process.env.NODE_ENV === "production") {
      // Create a new ratelimiter, that allows 10 requests per 10 seconds
      const ratelimit = new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(10, "10 s"),
      });

      const clientIp =
        ((req.headers["x-forwarded-for"] as string) || "")
          .split(",")
          .pop()
          ?.trim() ?? req.socket.remoteAddress;

      if (!clientIp) {
        throw new Error("Unable to get client IP");
      }

      const { success } = await ratelimit.limit(clientIp);

      if (!success) {
        res.status(429).end();
        return;
      }
    }

    const duration = performance.now() - now;

    res.status(200).end();

    // TODO: add those to a queue and process them in a background job as they are not critical
    switch (event.type) {
      case AbbyEventType.PING:
      case AbbyEventType.ACT: {
        await EventService.createEvent(event);
      }
    }

    await RequestCache.increment(event.projectId);
    RequestService.storeRequest({
      projectId: event.projectId,
      type: "TRACK_VIEW",
      durationInMs: duration,
    }).catch((e) => {
      console.error("Unable to store request", e);
    });
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
}
