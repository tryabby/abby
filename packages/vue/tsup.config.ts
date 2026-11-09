import { defineConfig } from "tsup";

export default defineConfig({
  dts: true,
  noExternal: ["shared/src/types"],
  clean: true,
  format: ["cjs", "esm"],
  sourcemap: true,
  treeshake: true,
});
