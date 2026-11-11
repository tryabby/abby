# `@tryabby/vue`

Vue 3 integration for Abby A/B Testing, Feature Flags, and Remote Config (`#68`).

## Installation

```bash
pnpm add @tryabby/vue @tryabby/core
```

## Setup & Usage

1. Initialize Abby with `defineConfig` and `createAbby`:

```ts
import { createAbby, defineConfig } from "@tryabby/vue";

export const abbyConfig = defineConfig({
  projectId: "your-project-id",
  currentEnvironment: "production",
  environments: ["production", "development"],
  tests: {
    heroBanner: { variants: ["A", "B"] },
  },
  flags: ["newCheckout"],
  remoteConfig: {
    welcomeTitle: "string",
  },
});

export const {
  AbbyProvider,
  useAbby,
  useFeatureFlag,
  useRemoteConfig,
} = createAbby(abbyConfig);
```

2. Wrap your application root in `<AbbyProvider>` (optionally passing `initialData` for SSR hydration):

```vue
<template>
  <AbbyProvider :initial-data="ssrData">
    <App />
  </AbbyProvider>
</template>
```

3. Consume `useAbby`, `useFeatureFlag`, and `useRemoteConfig` inside any descendant Vue component:

```ts
const { variant, onAct } = useAbby("heroBanner", {
  A: "Welcome Variant A",
  B: "Welcome Variant B",
});
const isNewCheckout = useFeatureFlag("newCheckout");
const welcomeTitle = useRemoteConfig("welcomeTitle");
```
