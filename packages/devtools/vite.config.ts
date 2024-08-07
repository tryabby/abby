import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
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
      emitCss: false,
      prebundleSvelteLibraries: true,
    }),
  ],
});
