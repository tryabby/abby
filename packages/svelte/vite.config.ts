import { resolve } from "node:path";
// vite.config.ts
import { svelte } from "@sveltejs/vite-plugin-svelte";
import type { UserConfig } from "vite";
import dts from "vite-plugin-dts";
import { type UserConfig as VitestConfig, configDefaults } from "vitest/config";

const config: UserConfig & { test: VitestConfig["test"] } = {
  build: {
    lib: {
      entry: [resolve(__dirname, "src/index.ts")],
      name: "abbySvelte",
      fileName: "index",
    },
    rollupOptions: {
      external: ["@tryabby/core"],
    },
  },
  plugins: [
    svelte({
      include: ["src/**/*.svelte"],
      emitCss: false,
    }),
    dts({
      entryRoot: resolve(__dirname, "src"),
    }),
  ],
  define: {
    // Eliminate in-source test code
    "import.meta.vitest": "undefined",
  },
  test: {
    // jest like globals
    globals: true,
    environment: "jsdom",
    // in-source testing
    includeSource: ["src/**/*.{js,ts,svelte}"],
    // Add @testing-library/jest-dom matchers & mocks of SvelteKit modules
    setupFiles: ["./src/tests/setupTest.ts"],
    // Exclude files in c8
    coverage: {
      exclude: ["setupTest.ts"],
    },
    // Exclude playwright tests folder
    exclude: [...configDefaults.exclude, "tests"],
  },
};

export default config;
