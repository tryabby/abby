import { PrismaClient } from "@prisma/client";
import { env } from "../../env/server.mjs";

declare global {
  var prisma: PrismaClient | undefined;
}

// biome-ignore lint/suspicious/noRedeclare:>
export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ["error"],
  });

if (env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
