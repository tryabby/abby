# @tryabby/vue

Vue 3 integration for [Abby](https://www.tryabby.com) (A/B testing, feature flags, and remote config). Supports Vue 3 and Nuxt 3 with full TypeScript inference.

## Installation

```bash
pnpm add @tryabby/vue
# or
npm install @tryabby/vue
```

## Setup

Create your Abby instance in a separate file (e.g. `./abby.ts`):

```ts
import { createAbby } from "@tryabby/vue";

export const abby = createAbby({
  projectId: "<your-project-id>",
  currentEnvironment: "production",
  environments: ["development", "production"],
  tests: {
    "footer-abtest": { variants: ["current", "new"] },
  },
  flags: ["new-features"],
  remoteConfig: {
    "button-color": "String",
  },
});
```

### Register the Vue Plugin or Provider

Register `AbbyVuePlugin` app-wide with `app.use()`:

```ts
import { createApp } from "vue";
import { abby } from "./abby";

const app = createApp(App);
app.use(abby.AbbyVuePlugin);
app.mount("#app");
```

Or wrap parts of your component tree with `<AbbyProvider>`:

```vue
<script setup lang="ts">
import { abby } from "./abby";
</script>

<template>
  <abby.AbbyProvider>
    <RouterView />
  </abby.AbbyProvider>
</template>
```

## Composables

### `useAbby`

```vue
<script setup lang="ts">
import { abby } from "./abby";

const { variant, onAct } = abby.useAbby("footer-abtest");
</script>

<template>
  <Footer v-if="variant === 'current'" />
  <NewFooter v-else-if="variant === 'new'" @purchase="onAct()" />
</template>
```

### `useFeatureFlag`

```vue
<script setup lang="ts">
import { abby } from "./abby";

const showNewFeatures = abby.useFeatureFlag("new-features");
</script>

<template>
  <div v-if="showNewFeatures">New Feature</div>
</template>
```

### `useRemoteConfig`

```vue
<script setup lang="ts">
import { abby } from "./abby";

const buttonColor = abby.useRemoteConfig("button-color");
</script>

<template>
  <button :style="{ color: buttonColor }">Click me</button>
</template>
```
