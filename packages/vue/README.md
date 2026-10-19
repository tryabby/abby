# @tryabby/vue

Vue 3 / Nuxt integration for [Abby](https://tryabby.com) feature flags, A/B testing, and remote config.

## Installation

```bash
npm install @tryabby/vue
# or
pnpm add @tryabby/vue
```

## Usage

```ts
import { createAbby } from "@tryabby/vue";

export const {
  AbbyProvider,
  AbbyPlugin,
  useAbby,
  useFeatureFlag,
  useRemoteConfig,
} = createAbby({
  projectId: "<YOUR_PROJECT_ID>",
  currentEnvironment: "production",
  environments: ["production", "development"],
  flags: ["newCheckout"],
  tests: {
    heroBanner: {
      variants: ["A", "B"] as const,
    },
  },
  remoteConfig: {
    welcomeMessage: "String",
  },
});
```
