// vite.config.ts
import { svelte } from "@sveltejs/vite-plugin-svelte";
import type { UserConfig } from 'vite';
import { configDefaults, type UserConfig as VitestConfig } from 'vitest/config';
import dts from 'vite-plugin-dts'

const config: UserConfig & { test: VitestConfig['test'] } = {
  plugins: [dts(), svelte()],
  define: {
    // Eliminate in-source test code
    'import.meta.vitest': 'undefined'
  },
  build: {
    lib: {
      entry: ["src/lib/index.ts"],
      formats: ["es"],
      fileName: "index",
      name: "abbySvelte",
    },
    rollupOptions: {
      output: {
        preserveModules: true,
        inlineDynamicImports: false
      }
    }
  },
  test: {
    // jest like globals
    globals: true,
    environment: 'jsdom',
    // in-source testing
    includeSource: ['src/**/*.{js,ts,svelte}'],
    // Add @testing-library/jest-dom matchers & mocks of SvelteKit modules
    setupFiles: ['./src/tests/setupTest.ts'],
    // Exclude files in c8
    coverage: {
      exclude: ['setupTest.ts']
    },
    // Exclude playwright tests folder
    exclude: [...configDefaults.exclude, 'tests']
  }
};

export default config;