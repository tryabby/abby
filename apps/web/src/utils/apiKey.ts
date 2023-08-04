import { createHmac, randomBytes } from "crypto";

export function generateRandomString(length = 32): string {
  const apiKey = randomBytes(length).toString("hex");
  return apiKey;
}

export function hashApiKey(apiKey: string): string {
  const hmac = createHmac(
    "sha256",
    "dieserkeyistsupergeheimbittenichtweitergebendanke"
  );
  hmac.update(apiKey);
  const hashKey = hmac.digest("hex");
  return hashKey;
}
