/// <reference types="vitest" />

import { defineConfig } from "vite";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./tests/setup.ts",
    // the type tests in *.test-d.ts are checked by `tsc`, see the test script
    include: ["tests/**/*.test.ts"],
  },
});
