/// <reference types="vitest" />

import { defineConfig } from 'vite';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		setupFiles: './src/tests/setup.ts'
	}
});
