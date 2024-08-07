import { createHmac, randomBytes } from "node:crypto";
import { env } from "env/server.mjs";

export function generateRandomString(length = 32): string {
  const apiKey = randomBytes(length).toString("hex");
  return apiKey;
}

export function hashString(data: string): string {
  const hmac = createHmac("sha256", env.HASHING_SECRET);
  hmac.update(data);
  const hashKey = hmac.digest("hex");
  return hashKey;
}
