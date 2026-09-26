/// <reference types="vitest" />

import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@tryabby/core/validation": resolve(
        __dirname,
        "../core/src/validation/index.ts"
      ),
      "@tryabby/core": resolve(__dirname, "../core/src/index.ts"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./tests/setup.ts",
    typecheck: {
      enabled: true,
      include: ["tests/types.test.ts"],
    },
  },
});
