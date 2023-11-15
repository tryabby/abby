import { PrismaClient } from "@prisma/client";
import { createRequire } from "node:module";
import { PrismaPlanetScale } from "@prisma/adapter-planetscale";

// hotfix for planetscale adapter (https://github.com/prisma/prisma/issues/21956)
const require = createRequire(import.meta.url);
const { Client } = require("@planetscale/database");

import { env } from "../../env/server.mjs";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  // enable planetscale adapter in production if enabled
  (env.USE_PLANETSCALE === "true"
    ? (() => {
        const client = new Client({ url: env.DATABASE_URL });
        const adapter = new PrismaPlanetScale(client);
        return new PrismaClient({ adapter, log: ["error"] });
      })()
    : new PrismaClient({
        log: ["error"],
      }));

if (env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
