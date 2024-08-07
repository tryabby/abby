import { createServerSideHelpers } from "@trpc/react-query/server";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import superjson from "superjson";
import { createContext } from "./context";
import { appRouter } from "./router/_app";

export async function getSSRTrpc(opts: CreateNextContextOptions) {
  return createServerSideHelpers({
    router: appRouter,
    ctx: await createContext(opts),
    transformer: superjson, // optional - adds superjson serialization
  });
}
