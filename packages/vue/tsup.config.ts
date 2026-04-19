import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["vue", "@tryabby/core"],
  minify: true,
  shims: true,
  splitting: false,
});