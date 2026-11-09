# `@tryabby/vue`

Official Vue 3 & Nuxt integration for [Abby](https://tryabby.com) feature flags, A/B testing, and remote configuration.

## Installation

```bash
pnpm add @tryabby/vue
```

## Quick Start

```ts
import { createAbby, defineConfig } from "@tryabby/vue";

const config = defineConfig({
  projectId: "<YOUR_PROJECT_ID>",
  currentEnvironment: "production",
  environments: ["production", "development"],
  flags: ["darkMode"],
  tests: {
    heroBanner: { variants: ["Control", "VariantB"] },
  },
  remoteConfig: {
    welcomeCopy: "String",
  },
});

export const {
  AbbyProvider,
  abbyPlugin,
  useAbby,
  useFeatureFlag,
  useRemoteConfig,
} = createAbby(config);
```
