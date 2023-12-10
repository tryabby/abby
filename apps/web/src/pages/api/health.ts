import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "server/db/client";
import { redis } from "server/db/redis";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // just a rndom query to check if db and redis are connected
  await Promise.allSettled([
    await prisma.verificationToken.count(),
    await redis.get("test"),
  ]);
  res.status(200).json({ status: "ok" });
}
