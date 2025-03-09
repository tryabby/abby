import { defineConfig } from "tsup";

export default defineConfig({
  dts: true,
  // we want to bundle the shared package because it's not published to npm
  // it's hacky :)
  noExternal: ["shared/src/types"],
  clean: true,
  format: ["cjs", "esm"],
  sourcemap: true,
  treeshake: true,
});
