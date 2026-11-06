import { defineConfig } from "tsup";

export default defineConfig({
  dts: true,
  clean: true,
  format: ["cjs", "esm"],
  sourcemap: true,
  treeshake: true,
  external: ["vue"],
});
