import { defineConfig } from "vite";
/// <reference types="vitest" />
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
  },
});
