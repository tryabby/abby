/* eslint-disable turbo/no-undeclared-env-vars */
import { createAbby } from "@tryabby/next";
import abbyDevtools from "@tryabby/devtools";

export const {
  useAbby,
  AbbyProvider,
  useFeatureFlag,
  withAbby,
  getFeatureFlagValue,
  withDevtools,
  withAbbyEdge,
  getABTestValue,
  withAbbyApiHandler,
  getABResetFunction,
} = createAbby({
  projectId: process.env.ABBY_PROJECT_ID!,
  currentEnvironment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  tests: {
    SignupButton: {
      variants: ["A", "B"],
    },
  },
  flags: ["AdvancedTestStats", "showFooter", "test"],
});

export const AbbyDevtools = withDevtools(abbyDevtools, {});
