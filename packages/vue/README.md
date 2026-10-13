# @tryabby/vue

Vue 3 integration for [Abby](https://www.tryabby.com) with feature parity to the React package.

## Installation

```bash
pnpm add @tryabby/vue
# or
npm i @tryabby/vue
```

## Quick start

```ts
// abby.ts
import { createAbby } from "@tryabby/vue";

export const {
  AbbyProvider,
  AbbyPlugin,
  useAbby,
  useFeatureFlag,
  useRemoteConfig,
} = createAbby({
  projectId: "your-project-id",
  currentEnvironment: process.env.NODE_ENV!,
  environments: ["development", "production"],
  tests: {
    hero: { variants: ["A", "B"] },
  },
  flags: ["newCheckout"],
  remoteConfig: {
    greeting: "String",
  },
});
```

### With a provider

```vue
<script setup lang="ts">
import { AbbyProvider, useAbby, useFeatureFlag } from "./abby";

const { variant, onAct } = useAbby("hero");
const newCheckout = useFeatureFlag("newCheckout");
</script>

<template>
  <AbbyProvider>
    <button @click="onAct">Variant: {{ variant }}</button>
    <p v-if="newCheckout">New checkout enabled</p>
  </AbbyProvider>
</template>
```

### With the Vue plugin (Nuxt-friendly)

```ts
import { createApp } from "vue";
import App from "./App.vue";
import { AbbyPlugin } from "./abby";

createApp(App).use(AbbyPlugin).mount("#app");
```

## API

| Export | Description |
| --- | --- |
| `useAbby(testName, lookup?)` | Reactive `{ variant, onAct }` for an A/B test |
| `useFeatureFlag(name)` | Reactive boolean flag |
| `useRemoteConfig(name)` | Reactive remote config value |
| `useFeatureFlags()` / `useRemoteConfigVariables()` | Lists of all flags / configs |
| `getABTestValue` / `getFeatureFlagValue` / `getRemoteConfig` | Sync getters |
| `getVariants` / `getABResetFunction` | Test helpers |
| `AbbyProvider` / `AbbyPlugin` | Provide Abby context |
| `withDevtools` | Optional Abby Devtools component factory |

See also the [React docs](https://docs.tryabby.com/integrations/react) — this package mirrors that surface for Vue 3.
