import { FeatureFlagType } from "@prisma/client";
import { PlanName } from "server/common/plans";

export type Plan = PlanName | "HOBBY";

export type PlausibleEvents = {
  "Sign Up Clicked": never;
  "Plan Selected": {
    Plan: Plan;
  };
  "Plan Upgrade Clicked": {
    Plan: Plan;
  };
  "Project Created": never;
  "AB-Test Created": {
    "Amount Of Variants": number;
  };
  "Environment Created": never;
  "Feature Flag Created": {
    "Feature Flag Type": FeatureFlagType;
  };
  "Devtools Opened": never;
  "API Project Data Retrieved": never;
};
