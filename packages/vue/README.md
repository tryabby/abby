# @tryabby/vue

Vue 3 integration for Abby: feature flags, A/B tests and remote config.

## Installation

```bash
npm install @tryabby/vue
```

## createAbby

`createAbby` takes the same config as `@tryabby/react` and `@tryabby/svelte` and returns the composables you use in your components.

```ts
// abby.ts
import { createAbby } from "@tryabby/vue";

export const {
  abbyPlugin,
  useAbby,
  useFeatureFlag,
  useRemoteConfig,
  getABTestValue,
  getFeatureFlagValue,
  getRemoteConfig,
} = createAbby({
  projectId: "<YOUR_PROJECT_ID>",
  currentEnvironment: process.env.NODE_ENV,
  environments: ["development", "production"],
  tests: {
    footer: { variants: ["OldFooter", "NewFooter"] },
  },
  flags: ["darkMode"],
  remoteConfig: {
    title: "String",
  },
});
```

Install the plugin once. It loads the project data from Abby and keeps every composable up to date.

```ts
// main.ts
import { createApp } from "vue";
import App from "./App.vue";
import { abbyPlugin } from "./abby";

createApp(App).use(abbyPlugin).mount("#app");
```

If you already have the project data (for example on the server), pass it as `initialData` to skip the request:

```ts
app.use(abbyPlugin, { initialData });
```

## useAbby

Returns the selected variant of an A/B test as a `ComputedRef` and an `onAct` function.
The variant is an empty string until the component is mounted so server and client markup match.
Call `onAct` when something that uses the selected variant was shown or used, it sends an event to Abby.

```vue
<script setup lang="ts">
import { useAbby } from "./abby";

const { variant, onAct } = useAbby("footer");
</script>

<template>
  <NewFooter v-if="variant === 'NewFooter'" @click="onAct" />
  <OldFooter v-else-if="variant === 'OldFooter'" @click="onAct" />
</template>
```

You can pass a lookup object as the second argument to map variants to any value:

```ts
const { variant } = useAbby("footer", {
  OldFooter: "old",
  NewFooter: "new",
});
```

## useFeatureFlag

Returns the value of a feature flag as a `ComputedRef<boolean>`.

```vue
<script setup lang="ts">
import { useFeatureFlag } from "./abby";

const darkMode = useFeatureFlag("darkMode");
</script>

<template>
  <div :class="{ dark: darkMode }">...</div>
</template>
```

`useFeatureFlags()` returns a `ComputedRef` with every flag as `{ name, value }`.

## useRemoteConfig

Returns the value of a remote config variable as a `ComputedRef` typed after your config (`"String"`, `"Number"` or `"JSON"`).

```ts
const title = useRemoteConfig("title");
```

## Outside of components

`getFeatureFlagValue(name)`, `getRemoteConfig(name)` and `getABTestValue(name, lookup?)` return the current value without reactivity. `getVariants(name)` returns all variants of a test and `getABResetFunction(name)` returns a function that clears the stored variant of a test.
