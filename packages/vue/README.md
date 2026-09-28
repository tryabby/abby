# `@tryabby/vue`

Vue 3 integration for [Abby](https://docs.tryabby.com) - A/B testing, feature flags and remote config.

Mirrors `@tryabby/react`: the same `createAbby` factory, the same type-level
quality, and the same runtime behaviour (including rendering an empty variant
on the first pass so SSR output never mismatches the server).

## Installation

```sh
pnpm add @tryabby/vue
```

`vue@^3` is a peer dependency.

## Usage

```ts
import { createAbby } from "@tryabby/vue";

export const {
  AbbyProvider,
  useAbby,
  useFeatureFlag,
  useFeatureFlags,
  useRemoteConfig,
  useRemoteConfigVariables,
  getABTestValue,
  getFeatureFlagValue,
  getRemoteConfig,
  getABResetFunction,
  getVariants,
  updateUserProperties,
} = createAbby({
  projectId: "YOUR_PROJECT_ID",
  environments: ["production"],
  currentEnvironment: "production",
  tests: {
    footer: { variants: ["old", "new"] },
  },
  flags: ["newCheckout"],
  remoteConfig: {
    welcomeMessage: "String",
  },
});
```

Wrap your app once (preferably with `initialData` fetched on the server):

```vue
<script setup lang="ts">
import { AbbyProvider } from "./abby";
</script>

<template>
  <AbbyProvider :initialData="initialData">
    <App />
  </AbbyProvider>
</template>
```

Use the composables in any descendant component (all reactive `computed` refs):

```vue
<script setup lang="ts">
import { useAbby, useFeatureFlag, useRemoteConfig } from "./abby";

const { variant, onAct } = useAbby("footer");
const newCheckout = useFeatureFlag("newCheckout");
const welcomeMessage = useRemoteConfig("welcomeMessage");
</script>

<template>
  <footer v-if="variant === 'new'" @click="onAct">new footer: {{ welcomeMessage }}</footer>
  <footer v-else @click="onAct">old footer</footer>
  <CheckoutV2 v-if="newCheckout" />
</template>
```

Plain (non-reactive) getters - `getABTestValue`, `getFeatureFlagValue`,
`getRemoteConfig`, `getVariants`, `getABResetFunction` - work anywhere,
including outside components.

## SSR / Nuxt notes

- `variant` starts as `""` on the very first render (the server never runs
  `onMounted`, so no variant is selected yet). Without a lookup object that
  empty string is the value; with a lookup object lacking a `""` key the
  value is `undefined` until the client resolves. Guard with `v-if="variant"`.
- One `createAbby()` result holds mutable project data on its core instance.
  On servers handling concurrent requests (Nuxt SSR), call `createAbby()`
  per request (e.g. inside a request-scoped plugin) instead of sharing one
  module-level instance, so request A passing `initialData` can never leak
  into request B that omits it. SPA / client-only usage can share one
  module-level instance (same as `@tryabby/react`).

## API parity with `@tryabby/react`

| React | Vue |
| --- | --- |
| `AbbyProvider` (`initialData` prop) | `AbbyProvider` (`initialData` prop) |
| `useAbby(name, lookup?)` ? `{ variant, onAct }` | `useAbby(name, lookup?)` ? `{ variant: ComputedRef, onAct }` |
| `useFeatureFlag(name)` | `useFeatureFlag(name)` ? `ComputedRef<boolean>` |
| `useFeatureFlags()` | `useFeatureFlags()` ? `ComputedRef<Array<...>>` |
| `useRemoteConfig(name)` | `useRemoteConfig(name)` ? `ComputedRef<...>` |
| `useRemoteConfigVariables()` | `useRemoteConfigVariables()` ? `ComputedRef<Array<...>>` |
| `withDevtools(factory, props)` ? hook | `withDevtools(factory, props)` ? component |
