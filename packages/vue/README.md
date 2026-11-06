# @tryabby/vue

Official Vue 3 integration for Abby A/B testing, feature flags, and remote config.

## Installation

```bash
npm install @tryabby/vue
# or
pnpm add @tryabby/vue
# or
yarn add @tryabby/vue
```

## Quick Start

### 1. Initialize Abby

Create an Abby client instance in `abby.ts` (or `abby.js`):

```ts
import { createAbby } from "@tryabby/vue";

export const abby = createAbby({
  projectId: "your-project-id",
  currentEnvironment: process.env.NODE_ENV ?? "development",
  environments: ["development", "production"],
  tests: {
    heroTitle: {
      variants: ["OldTitle", "NewTitle"],
    },
  },
  flags: ["newSearchFeature"],
  remoteConfig: {
    bannerMessage: "String",
    maxItems: "Number",
  },
});

export const {
  useAbby,
  useFeatureFlag,
  useFeatureFlags,
  useRemoteConfig,
  useRemoteConfigVariables,
  AbbyProvider,
  AbbyPlugin,
} = abby;
```

### 2. Setup Provider or Plugin

#### Option A: Using `AbbyPlugin` in `main.ts`

```ts
import { createApp } from "vue";
import App from "./App.vue";
import { AbbyPlugin } from "./abby";

const app = createApp(App);
app.use(AbbyPlugin);
app.mount("#app");
```

#### Option B: Using `<AbbyProvider>` in your Root Component

```vue
<template>
  <AbbyProvider>
    <RouterView />
  </AbbyProvider>
</template>

<script setup lang="ts">
import { AbbyProvider } from "./abby";
</script>
```

### 3. Use Composables

#### A/B Testing (`useAbby`)

```vue
<template>
  <div>
    <h1>{{ title }}</h1>
    <button @click="onAct">Convert</button>
  </div>
</template>

<script setup lang="ts">
import { useAbby } from "./abby";

const { variant, onAct } = useAbby("heroTitle", {
  OldTitle: "Welcome to our store",
  NewTitle: "Discover amazing products",
});
// variant is a ComputedRef
const title = variant;
</script>
```

#### Feature Flags (`useFeatureFlag`)

```vue
<template>
  <div v-if="hasNewSearch">
    <NewSearchComponent />
  </div>
</template>

<script setup lang="ts">
import { useFeatureFlag } from "./abby";

const hasNewSearch = useFeatureFlag("newSearchFeature");
</script>
```

#### Remote Config (`useRemoteConfig`)

```vue
<template>
  <div>
    <p>{{ banner }}</p>
  </div>
</template>

<script setup lang="ts">
import { useRemoteConfig } from "./abby";

const banner = useRemoteConfig("bannerMessage");
</script>
```

## Synchronous Helpers

Direct access without Vue reactive context:

```ts
import { abby } from "./abby";

const isEnabled = abby.getFeatureFlagValue("newSearchFeature");
const currentVariant = abby.getABTestValue("heroTitle");
const banner = abby.getRemoteConfig("bannerMessage");

// Reset variant in storage
abby.getABResetFunction("heroTitle")();
```

## Devtools Integration

To use the visual Abby Devtools during development:

```bash
npm install @tryabby/devtools --save-dev
```

In your root component (e.g. `App.vue`):

```vue
<script setup lang="ts">
import { onMounted } from "vue";
import devtools from "@tryabby/devtools";
import { abby } from "./abby";

onMounted(() => {
  if (process.env.NODE_ENV === "development") {
    const unmount = abby.withDevtools(devtools, {});
    // devtools are now mounted
  }
});
</script>
```

## License

ISC
