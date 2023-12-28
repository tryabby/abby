import { env } from "env/client.mjs";
import { z } from "zod";

export const planNameSchema = z.enum([
  "STARTUP",
  "PRO",
  "ENTERPRISE",
  "BETA",
  "STARTUP_LIFETIME",
]);

export type PlanName = z.infer<typeof planNameSchema>;

export const PLANS: Record<PlanName, string> = {
  STARTUP: env.NEXT_PUBLIC_STRIPE_STARTER_PLAN_PRICE_ID,
  STARTUP_LIFETIME: "STARTUP_LIFETIME",
  PRO: env.NEXT_PUBLIC_STRIPE_PRO_PLAN_PRICE_ID,
  ENTERPRISE: "ENTERPRISE",
  BETA: "BETA",
};

export type Limit = {
  tests: number;
  eventsPerMonth: number;
  environments: number;
  flags: number;
};

export const getLimitByPlan = (plan: PlanName | null): Limit => {
  switch (plan) {
    case "STARTUP_LIFETIME":
    case "STARTUP":
      return {
        eventsPerMonth: 10_000,
        tests: 10,
        environments: 5,
        flags: 30,
      };
    case "PRO":
      return {
        eventsPerMonth: 100_000,
        tests: 10,
        environments: 10,
        flags: 50,
      };
    case "BETA":
    case "ENTERPRISE": {
      return {
        eventsPerMonth: Infinity,
        tests: Infinity,
        environments: Infinity,
        flags: Infinity,
      };
    }
    // free plan
    default: {
      return {
        eventsPerMonth: 1000,
        tests: 1,
        environments: 5,
        flags: 3,
      };
    }
  }
};
