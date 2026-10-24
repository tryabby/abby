import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  root: path.resolve(__dirname),
  resolve: {
    alias: { "@tryabby/vue": path.resolve(__dirname, "../dist/index.mjs") },
  },
  build: { outDir: "build", emptyOutDir: true },
});
