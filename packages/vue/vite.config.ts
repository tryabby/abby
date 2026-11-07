/// <reference types="vitest" />

import { defineConfig } from "vite";

// Configure Vitest with jsdom and MSW network interception for Vue composable testing.
export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./tests/setup.ts",
  },
});
