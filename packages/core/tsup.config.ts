import { defineConfig } from "tsup";

export default defineConfig({
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  format: ["cjs", "esm"],
});
