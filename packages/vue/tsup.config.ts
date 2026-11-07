import { defineConfig } from "tsup";

export default defineConfig({
  dts: true,
  clean: true,
  external: ["vue"],
  format: ["cjs", "esm"],
  sourcemap: true,
  treeshake: true,
});
