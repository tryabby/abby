import { NodeClickHouseClient } from "@clickhouse/client/dist/client";
import { env } from "../../env/server.mjs";
import { createClient } from "@clickhouse/client";

declare global {
  // eslint-disable-next-line no-var
  var clickhouseClient: NodeClickHouseClient | undefined;
}

export const clickhouseClient = global.clickhouseClient || createClient();

if (env.NODE_ENV !== "production") {
  global.clickhouseClient = clickhouseClient;
}
