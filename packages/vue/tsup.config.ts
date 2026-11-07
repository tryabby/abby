import { defineConfig } from "tsup";

// Bundle shared internal types while emitting dual CJS/ESM artifacts with TypeScript declarations.
export default defineConfig({
  dts: true,
  noExternal: ["shared/src/types"],
  clean: true,
  format: ["cjs", "esm"],
  sourcemap: true,
  treeshake: true,
});
