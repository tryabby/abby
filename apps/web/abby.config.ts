import { defineConfig } from "@tryabby/core";

export default defineConfig(
  {
    // biome-ignore lint/style/noNonNullAssertion:>
    projectId: process.env.NEXT_PUBLIC_ABBY_PROJECT_ID!,
    currentEnvironment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    apiUrl: process.env.NEXT_PUBLIC_ABBY_API_URL,
    debug: process.env.NEXT_PUBLIC_ABBY_DEBUG === "true",
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
    cookies: { disableByDefault: true, expiresInDays: 30 },
  }
);
