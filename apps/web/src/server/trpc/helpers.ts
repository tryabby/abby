import { createServerSideHelpers } from "@trpc/react-query/server";
import superjson from "superjson";
import { appRouter } from "./router/_app";
import { createContext } from "./context";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";

export async function getSSRTrpc(opts: CreateNextContextOptions) {
  return createServerSideHelpers({
    router: appRouter,
    ctx: await createContext(opts),
    transformer: superjson, // optional - adds superjson serialization
  });
}
