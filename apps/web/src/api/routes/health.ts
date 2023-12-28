import { Hono } from "hono";
import { prisma } from "server/db/client";
import { redis } from "server/db/redis";

export function makeHealthRoute() {
  const app = new Hono().get("/", async (c) => {
    await Promise.allSettled([
      await prisma.verificationToken.count(),
      await redis.get("test"),
    ]);
    return c.json({ status: "ok" });
  });
  return app;
}
