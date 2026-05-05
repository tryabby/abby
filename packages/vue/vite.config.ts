/// <reference types="vitest" />

import { defineConfig } from "vite";
import { resolve } from "node:path";

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
  },
});
