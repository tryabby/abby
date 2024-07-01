import { defineConfig } from "tsup";
import type { Options } from "tsup";

const options: Options = {
  clean: true,
  entry: ["src/index.ts"],
  noExternal: [/^@tryabby\/.*$/u, /^@\/.*$/u],
  sourcemap: true,
  splitting: false,
};

if (process.env.WATCH) {
  options.watch = ["src/**/*", "../../packages/**/*"];
  options.onSuccess = "node dist/index.js";
}

export default defineConfig(options);
