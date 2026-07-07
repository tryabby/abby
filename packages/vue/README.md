# @tryabby/vue

The official [Abby](https://www.tryabby.com) integration for **Vue 3** and **Nuxt**.

It gives you fully-typed composables for A/B tests, feature flags and remote config, with the same API surface and type quality as the React and Svelte packages.

## Installation

```bash
npm install @tryabby/vue
# or
pnpm add @tryabby/vue
```

## Quick start

Create your Abby instance once and export the composables from it:

```ts
// abby.ts
import { createAbby } from "@tryabby/vue";

export const {
  useAbby,
  useFeatureFlag,
  useRemoteConfig,
  AbbyProvider,
  getFeatureFlagValue,
  getRemoteConfig,
  getABTestValue,
} = createAbby({
  projectId: "<YOUR_PROJECT_ID>",
  currentEnvironment: import.meta.env.MODE,
  environments: ["development", "production"],
  tests: {
    "footer-test": { variants: ["old", "new"] },
  },
  flags: ["new-dashboard"],
  remoteConfig: { theme: "String" },
});
```

Register the `AbbyProvider` plugin on your app. It loads your project data on
the client (and accepts server-fetched `initialData` for SSR):

```ts
// main.ts
import { createApp } from "vue";
import App from "./App.vue";
import { AbbyProvider } from "./abby";

createApp(App).use(AbbyProvider).mount("#app");
```

## Composables

### `useAbby`

Returns the reactive variant for a test and an `onAct` callback to report an
interaction. The variant is a `ComputedRef`, so it works in templates directly.

```vue
<script setup lang="ts">
import { useAbby } from "./abby";

const { variant, onAct } = useAbby("footer-test");
</script>

<template>
  <NewFooter v-if="variant === 'new'" @click="onAct" />
  <OldFooter v-else @click="onAct" />
</template>
```

You can also pass a lookup object to map each variant to a value:

```ts
const { variant } = useAbby("footer-test", { old: 0, new: 1 });
// variant.value is 0 | 1
```

### `useFeatureFlag`

```vue
<script setup lang="ts">
import { useFeatureFlag } from "./abby";

const showDashboard = useFeatureFlag("new-dashboard"); // Ref<boolean>
</script>
```

### `useRemoteConfig`

```vue
<script setup lang="ts">
import { useRemoteConfig } from "./abby";

const theme = useRemoteConfig("theme"); // Ref<string>
</script>
```

## Non-reactive helpers

For places outside of a component's reactive scope (route guards, plain
modules, event handlers) the instance also exposes plain getters:

- `getFeatureFlagValue(name)` – the current value of a feature flag
- `getRemoteConfig(name)` – the current value of a remote config entry
- `getABTestValue(name, lookup?)` – the currently selected variant of a test
- `getVariants(name)` – all variants of a test
- `getABResetFunction(name)` – resets the persisted variant of a test
- `updateUserProperties(user)` – updates user properties for targeting

## Nuxt / SSR

To avoid hydration mismatches, `useAbby` renders an empty variant on the server
and resolves the real variant on mount. When you fetch project data on the
server, hand it to the provider so flags and remote config are available during
the first render:

```ts
app.use(AbbyProvider, { initialData });
```

## License

ISC
