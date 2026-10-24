import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    environmentOptions: { jsdom: { url: "https://vue.example.test" } },
    include: ["tests/**/*.test.ts"],
    restoreMocks: true,
  },
});
