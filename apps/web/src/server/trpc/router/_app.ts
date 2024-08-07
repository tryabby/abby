import { router } from "../trpc";
import { apiKeyRouter } from "./apikey";
import { authRouter } from "./auth";
import { couponRouter } from "./coupons";
import { environmentRouter } from "./environments";
import { eventRouter } from "./events";
import { exampleRouter } from "./example";
import { flagRouter } from "./flags";
import { inviteRouter } from "./invite";
import { miscRouter } from "./misc";
import { projectRouter } from "./project";
import { projectUserRouter } from "./project-user";
import { testRouter } from "./tests";
import { userRouter } from "./user";

export const appRouter = router({
  example: exampleRouter,
  auth: authRouter,
  user: userRouter,
  project: projectRouter,
  projectUser: projectUserRouter,
  invite: inviteRouter,
  events: eventRouter,
  tests: testRouter,
  flags: flagRouter,
  environments: environmentRouter,
  coupons: couponRouter,
  misc: miscRouter,
  apikey: apiKeyRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
