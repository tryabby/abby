# @tryabby/vue

Official Vue 3 integration for [Abby](https://tryabby.com) — A/B Testing, Feature Flags, and Remote Config.

## Installation

```bash
pnpm add @tryabby/vue vue
# or
npm install @tryabby/vue vue
# or
yarn add @tryabby/vue vue
```

## Quick Start

### 1. Define configuration with `createAbby`

```ts
import { createAbby } from "@tryabby/vue";

export const {
  useAbby,
  useFeatureFlag,
  useRemoteConfig,
  AbbyProvider,
  AbbyPlugin,
} = createAbby({
  projectId: "YOUR_PROJECT_ID",
  currentEnvironment: "production",
  tests: {
    heroTest: {
      variants: ["variantA", "variantB"],
    },
  },
  flags: ["darkMode"],
  remoteConfig: {
    heroHeadline: "String",
  },
});
```

### 2. Install Plugin in Vue App or Wrap with `AbbyProvider`

```ts
import { createApp } from "vue";
import App from "./App.vue";
import { AbbyPlugin } from "./abby";

const app = createApp(App);
app.use(AbbyPlugin);
app.mount("#app");
```

### 3. Use in Vue Components

```vue
<script setup lang="ts">
import { useAbby, useFeatureFlag, useRemoteConfig } from "./abby";

const { variant, onAct } = useAbby("heroTest", {
  variantA: "Welcome to Version A!",
  variantB: "Welcome to Version B!",
});

const isDarkMode = useFeatureFlag("darkMode");
const headline = useRemoteConfig("heroHeadline");
</script>

<template>
  <div>
    <h1>{{ headline }}</h1>
    <p>{{ variant }}</p>
    <button @click="onAct">Convert</button>
  </div>
</template>
```

## License

ISC
