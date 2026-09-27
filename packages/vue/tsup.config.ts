import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  dts: true,
  // we want to bundle the shared package because it's not published to npm
  // it's hacky :)
  noExternal: ["shared/src/types"],
  clean: true,
  format: ["cjs", "esm"],
  sourcemap: true,
  treeshake: true,
  // vue is a peer dependency, it should never be bundled into the package
  external: ["vue"],
});
