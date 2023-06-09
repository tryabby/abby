import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: ["src/index.ts"],
      formats: ["umd", "es"],
      fileName: "index",
      name: "abbyDevtools",
    },
  },
  plugins: [
    dts(),
    svelte({
      include: ["src/**/*.svelte"],
      compilerOptions: {
        // eslint-disable-next-line turbo/no-undeclared-env-vars
        // customElement: process.env.STORYBOOK !== "1",
      },
      emitCss: false,
      prebundleSvelteLibraries: true,
    }),
  ],
});
