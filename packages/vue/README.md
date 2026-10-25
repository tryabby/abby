# `@tryabby/vue`

Official Vue 3 & Nuxt 3 integration for [Abby](https://tryabby.com) — Feature Flags, A/B Testing, and Remote Config with full TypeScript inference.

## Installation

```bash
pnpm add @tryabby/vue
# or
npm install @tryabby/vue
```

## Quick Start (Vue 3)

### 1. Initialize Abby (`abby.ts`)

```ts
import { createAbby } from "@tryabby/vue";

export const {
  AbbyProvider,
  abbyPlugin,
  useAbby,
  useFeatureFlag,
  useFeatureFlags,
  useRemoteConfig,
  useRemoteConfigVariables,
  getFeatureFlagValue,
  getRemoteConfig,
  getABTestValue,
  getVariants,
  getABResetFunction,
  withDevtools,
  withAbby,
} = createAbby({
  projectId: "<YOUR_PROJECT_ID>",
  currentEnvironment: "production",
  environments: ["production", "development"],
  tests: {
    heroBanner: {
      variants: ["control", "variantB"],
    },
  },
  flags: ["darkMode", "betaCheckout"],
  remoteConfig: {
    welcomeHeading: "String",
    maxItems: "Number",
  },
});
```

### 2. Provide Abby in your application

Wrap your root component with `<AbbyProvider>` **or** register `abbyPlugin` on your Vue app instance:

```vue
<!-- App.vue -->
<script setup lang="ts">
import { AbbyProvider } from "./abby";
</script>

<template>
  <AbbyProvider>
    <RouterView />
  </AbbyProvider>
</template>
```

Or via `app.use(abbyPlugin)` in `main.ts`:

```ts
import { createApp } from "vue";
import App from "./App.vue";
import { abbyPlugin } from "./abby";

createApp(App).use(abbyPlugin).mount("#app");
```

### 3. Use Composables in Components

```vue
<script setup lang="ts">
import { useAbby, useFeatureFlag, useRemoteConfig } from "./abby";

const { variant, onAct } = useAbby("heroBanner");
const isDarkMode = useFeatureFlag("darkMode");
const welcomeHeading = useRemoteConfig("welcomeHeading");
</script>

<template>
  <section :class="{ dark: isDarkMode }">
    <h1>{{ welcomeHeading }}</h1>
    <button v-if="variant === 'variantB'" @click="onAct">
      Try Variant B
    </button>
    <button v-else @click="onAct">
      Default Action
    </button>
  </section>
</template>
```

## Nuxt 3 / SSR Integration

Use `withAbby` on the server or pass `initialData` to `abbyPlugin` / `<AbbyProvider>`:

```ts
// plugins/abby.ts
import { abbyPlugin, withAbby } from "~/utils/abby";

export default defineNuxtPlugin(async (nuxtApp) => {
  if (import.meta.server) {
    const loader = withAbby();
    nuxtApp.payload.abby = await loader(nuxtApp.ssrContext?.event);
  }

  nuxtApp.vueApp.use(abbyPlugin, {
    initialData: nuxtApp.payload.abby?.__abby__data,
    cookies: nuxtApp.payload.abby?.__abby_cookie,
  });
});
```
