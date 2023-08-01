import { getTokenFilePath } from "./consts";
import fs from "fs/promises";
import { z } from "zod";

export const tokenFileSchema = z.object({
  token: z.string(),
});

export function writeTokenFile(token: string) {
  return fs.writeFile(getTokenFilePath(), JSON.stringify({ token }));
}

export async function getToken() {
  const contents = await fs.readFile(getTokenFilePath(), "utf-8");
  return tokenFileSchema.parse(JSON.parse(contents)).token;
}
