import { createHmac, randomBytes } from "crypto";

export function generateRandomString(length: number): string {
  const apiKeyLength = 32; // Adjust the length of the API key as needed
  const apiKey = randomBytes(apiKeyLength).toString("hex");
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
