# @tryabby/vue

Vue 3 integration for [Abby](https://tryabby.com) - A/B testing, feature flags, and remote config.

## Installation

```bash
npm install @tryabby/vue
# or
pnpm add @tryabby/vue
# or
yarn add @tryabby/vue
```

## Quickstart

### 1. Initialize Abby

Create an Abby instance with your project configuration:

```ts
// abby.ts
import { createAbby } from "@tryabby/vue";

export const {
  useAbby,
  useFeatureFlag,
  useFeatureFlags,
  useRemoteConfig,
  useRemoteConfigVariables,
  AbbyProvider,
  AbbyPlugin,
} = createAbby({
  projectId: "your-project-id",
  currentEnvironment: "production",
  tests: {
    heroTitle: {
      variants: ["headlineA", "headlineB"],
    },
  },
  flags: {
    newCheckout: "Boolean",
  },
  remoteConfig: {
    bannerText: "String",
  },
});
```

### 2. Provide Abby Context

You can wrap your application with `<AbbyProvider>` or use `app.use(AbbyPlugin)`:

#### Option A: Component Provider

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

#### Option B: Vue Plugin

```ts
// main.ts
import { createApp } from "vue";
import App from "./App.vue";
import { AbbyPlugin } from "./abby";

const app = createApp(App);
app.use(AbbyPlugin);
app.mount("#app");
```

### 3. Use Composables

#### A/B Testing (`useAbby`)

```vue
<script setup lang="ts">
import { useAbby } from "./abby";

const { variant, onAct } = useAbby("heroTitle", {
  headlineA: "Supercharge your business",
  headlineB: "The fastest way to grow",
});
</script>

<template>
  <div>
    <h1>{{ variant }}</h1>
    <button @click="onAct">Get Started</button>
  </div>
</template>
```

#### Feature Flags (`useFeatureFlag`)

```vue
<script setup lang="ts">
import { useFeatureFlag } from "./abby";

const newCheckoutEnabled = useFeatureFlag("newCheckout");
</script>

<template>
  <NewCheckout v-if="newCheckoutEnabled" />
  <LegacyCheckout v-else />
</template>
```

#### Remote Config (`useRemoteConfig`)

```vue
<script setup lang="ts">
import { useRemoteConfig } from "./abby";

const bannerText = useRemoteConfig("bannerText");
</script>

<template>
  <div v-if="bannerText" class="announcement">
    {{ bannerText }}
  </div>
</template>
```

## Synchronous Helpers

Direct programmatic access outside Vue components:

```ts
import {
  getABTestValue,
  getFeatureFlagValue,
  getRemoteConfig,
} from "./abby";

const variant = getABTestValue("heroTitle");
const flag = getFeatureFlagValue("newCheckout");
const banner = getRemoteConfig("bannerText");
```

## License

ISC
