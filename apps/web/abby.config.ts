/* eslint-disable turbo/no-undeclared-env-vars */
import { defineConfig } from "@tryabby/core";

export default defineConfig(
  {
    projectId: process.env.NEXT_PUBLIC_ABBY_PROJECT_ID!,
    currentEnvironment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    apiUrl: process.env.NEXT_PUBLIC_ABBY_API_URL,
  },
  {
    environments: ["development", "production"],
    tests: {
      SignupButton: {
        variants: ["A", "B"],
      },
      TipsAndTricks: {
        variants: ["Blog"],
      },
    },
    flags: ["AdvancedTestStats", "showFooter", "test"],
    remoteConfig: {
      abc: "JSON",
    },
  }
);
