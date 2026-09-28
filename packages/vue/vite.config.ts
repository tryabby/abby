/// <reference types="vitest" />

import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    // use the full build so @vue/test-utils can compile `template` strings
    alias: {
      vue: "vue/dist/vue.esm-bundler.js",
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./tests/setup.ts",
  },
});
