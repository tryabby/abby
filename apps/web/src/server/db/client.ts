import { PrismaClient } from "@prisma/client";
import { connect } from "@planetscale/database";
import { PrismaPlanetScale } from "@prisma/adapter-planetscale";

import { env } from "../../env/server.mjs";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  // enable planetscale adapter in production if enabled
  (env.NODE_ENV === "production" && env.USE_PLANETSCALE
    ? (() => {
        const connection = connect({ url: env.DATABASE_URL });
        const adapter = new PrismaPlanetScale(connection);
        return new PrismaClient({ adapter, log: ["error"] });
      })()
    : new PrismaClient({
        log: ["error"],
      }));

if (env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
