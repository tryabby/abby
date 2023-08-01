/* eslint-disable turbo/no-undeclared-env-vars */
import { defineConfig } from "@tryabby/core";

export default defineConfig({
  projectId: "clkij7gyf0002px7cn3ney8qi",
  currentEnvironment: "",
  environments: ["development", "production"],
  apiUrl: "http://localhost:3000",
  tests: {
    SignupButton: {
      variants: ["A", "B"],
    },
  },
  flags: {
    AdvancedTestStats: "Boolean",
    showFooter: "Boolean",
    test: "Boolean",
    abc: "JSON",
    xd: "Number",
    xd2: "String",
  },
});
