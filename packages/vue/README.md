# @tryabby/vue

Vue 3 integration for [Abby](https://www.tryabby.com) (A/B testing, feature flags and remote config). It provides full type safety for your tests, flags and remote config variables and works with plain Vue 3 as well as Nuxt 3.

## Installation

```bash
pnpm add @tryabby/vue
# or
npm install @tryabby/vue
```

## Setup

Create your abby instance in a separate file (e.g. `./abby.ts`), the configuration is identical to [`@tryabby/react`](../react/README.md):

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

### Vue plugin

Register the instance app-wide with `app.use()`:

```ts
import { createApp } from "vue";
import { abby } from "./abby";

const app = createApp(App);
app.use(abby.AbbyVuePlugin);
app.mount("#app");
```

Alternatively you can wrap parts of your tree with the `<AbbyProvider>` component:

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

### useAbby

Returns a reactive `variant` and an `onAct` function that reports a conversion to the server:

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

You can also pass a lookup object to map the variants to values. The resulting type of `variant` is narrowed to the values of the lookup object:

```ts
const { variant } = abby.useAbby("footer-abtest", {
  current: () => renderOldFooter(),
  new: () => renderNewFooter(),
});
```

### useFeatureFlag

Returns a reactive boolean for one of your defined feature flags:

```ts
import { abby } from "./abby";

const { useFeatureFlag } = abby;

// inside a component setup:
const showNewFeatures = useFeatureFlag("new-features");
```

```vue
<template>
  <div v-if="showNewFeatures">...</div>
</template>
```

### useRemoteConfig

Returns a reactive, typed value of one of your defined remote config variables:

```ts
import { abby } from "./abby";

const { useRemoteConfig } = abby;

// inside a component setup:
const buttonColor = useRemoteConfig("button-color");
```

```vue
<template>
  <button :style="{ color: buttonColor }">Click me</button>
</template>
```

## Nuxt 3

Register the plugin in `plugins/abby.ts`:

```ts
import { abby } from "~/abby";

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(abby.AbbyVuePlugin);
});
```

For server side rendering and hydration, fetch the project data in a server route or via `withAbby` and pass it to the plugin as `initialData`:

```ts
import { abby } from "~/abby";

export default defineNuxtPlugin(async (nuxtApp) => {
  const { __abby__data } = await abby.withAbby()();
  nuxtApp.payload.abby = __abby__data;
  nuxtApp.vueApp.use(abby.AbbyVuePlugin, {
    initialData: nuxtApp.payload.abby,
  });
});
```

## Usage outside of components

Every composable falls back to the global singleton of your `createAbby` instance, so it can also be used in stores or plain TypeScript files without a provider.

## Additional helpers

| Function                                     | Description                                                     |
| -------------------------------------------- | --------------------------------------------------------------- |
| `getFeatureFlagValue(name)`                  | Get the value of a feature flag outside of components           |
| `getRemoteConfig(name)`                      | Get the value of a remote config variable outside of components |
| `getABTestValue(name, lookupObject?)`        | Get the variant of an A/B test outside of components            |
| `getVariants(name)`                          | Get all variants of a test                                      |
| `getABResetFunction(name)`                   | Reset the locally stored variant of a test                      |
| `useFeatureFlags()`                          | Reactive list of all flags with their name and value            |
| `useRemoteConfigVariables()`                 | Reactive list of all remote config variables                    |
| `updateUserProperties(user)`                 | Update the user properties used for flag targeting              |
| `withDevtools(factory, props?)`              | Render the abby devtools (development only)                     |
| `withAbby(handler?)`                         | Server-side data loader for Nuxt 3 / h3                         |
