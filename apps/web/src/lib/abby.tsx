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
  projectId: process.env.NEXT_PUBLIC_ABBY_PROJECT_ID!,
  currentEnvironment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  apiUrl: process.env.NEXT_PUBLIC_ABBY_API_URL,
  tests: {
    SignupButton: {
      variants: ["A", "B"],
    },
  },
  flags: {
    AdvancedTestStats: "Boolean",
    showFooter: "Boolean",
    test: "Boolean",
    abc: "JSON",
  },
});

export const AbbyDevtools = withDevtools(abbyDevtools, {});
