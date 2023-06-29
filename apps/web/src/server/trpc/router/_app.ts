import { router } from "../trpc";
import { authRouter } from "./auth";
import { environmentRouter } from "./environments";
import { eventRouter } from "./events";
import { exampleRouter } from "./example";
import { flagRouter } from "./flags";
import { inviteRouter } from "./invite";
import { projectRouter } from "./project";
import { projectUserRouter } from "./project-user";
import { testRouter } from "./tests";
import { userRouter } from "./user";
import { couponRouter } from "./coupons";
import { miscRouter } from "./misc";
import { apiKeyRouter } from "./apikey";

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
