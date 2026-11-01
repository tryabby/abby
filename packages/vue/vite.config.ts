import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
  },
});
