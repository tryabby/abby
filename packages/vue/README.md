# `@tryabby/vue`

Typed Vue 3 integration for [Abby](https://tryabby.dev) A/B testing, feature flags, and remote configuration.

## Client-Only Usage (SPA)

```ts
import { createAbby } from "@tryabby/vue";

export const { plugin, useAbTest, useFeatureFlag, useRemoteConfig } = createAbby({
  projectId: "YOUR_PROJECT_ID",
  currentEnvironment: "production",
  environments: ["production", "development"],
  tests: {
    headerTest: { variants: ["A", "B"] },
  },
  flags: ["darkMode"],
  remoteConfig: {
    maxItems: "number",
  },
});
```

## SSR Usage (Per-Request Instance)

In SSR environments (e.g., Nuxt / Vite SSR), create a fresh Abby instance per request so `updateUserProperties` and state are never shared across concurrent requests:

```ts
import { createSSRApp } from "vue";
import { createAbby } from "@tryabby/vue";
import App from "./App.vue";

export function createApp() {
  const app = createSSRApp(App);
  const abby = createAbby({
    projectId: "YOUR_PROJECT_ID",
    currentEnvironment: "production",
    environments: ["production", "development"],
    tests: { headerTest: { variants: ["A", "B"] } },
    flags: ["darkMode"],
    remoteConfig: { maxItems: "number" },
  });
  app.use(abby.plugin);
  return { app, abby };
}
```
