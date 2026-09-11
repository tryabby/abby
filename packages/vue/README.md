# @tryabby/vue

Vue 3 & Nuxt integration for [Abby](https://tryabby.com).

## Installation

```bash
pnpm add @tryabby/vue vue
# or
npm install @tryabby/vue vue
```

## Quick Start

### 1. Define Config

```ts
// abby.config.ts
import { defineConfig } from "@tryabby/vue";

export default defineConfig({
  projectId: "<YOUR_PROJECT_ID>",
  currentEnvironment: process.env.NODE_ENV,
  environments: ["production", "development"],
  tests: {
    bannerColor: { variants: ["blue", "green"] },
  },
  flags: ["newDashboard"],
  remoteConfig: {
    promoText: "String",
  },
});
```

### 2. Create Instance

```ts
// abby.ts
import { createAbby } from "@tryabby/vue";
import config from "./abby.config";

export const {
  AbbyProvider,
  AbbyPlugin,
  useAbby,
  useFeatureFlag,
  useRemoteConfig,
  getFeatureFlagValue,
  getRemoteConfig,
} = createAbby(config);
```

### 3. Usage in App

Using the plugin:

```ts
import { createApp } from "vue";
import App from "./App.vue";
import { AbbyPlugin } from "./abby";

const app = createApp(App);
app.use(AbbyPlugin);
app.mount("#app");
```

Or using the `<AbbyProvider>` component:

```vue
<script setup lang="ts">
import { AbbyProvider } from "./abby";
</script>

<template>
  <AbbyProvider>
    <router-view />
  </AbbyProvider>
</template>
```

### 4. In Components

```vue
<script setup lang="ts">
import { useAbby, useFeatureFlag, useRemoteConfig } from "./abby";

const { variant, onAct } = useAbby("bannerColor");
const isNewDashboard = useFeatureFlag("newDashboard");
const promoText = useRemoteConfig("promoText");
</script>

<template>
  <div :class="`banner banner-${variant}`">
    <p>{{ promoText }}</p>
    <button @click="onAct">Get Started</button>
  </div>
</template>
```
