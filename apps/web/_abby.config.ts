/* eslint-disable turbo/no-undeclared-env-vars */
import { defineConfig } from "@tryabby/core";

export default defineConfig({
  projectId: process.env.NEXT_PUBLIC_ABBY_PROJECT_ID!,
  currentEnvironment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  environments: ["development", "production"],
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
