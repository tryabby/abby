# @tryabby/vue

Vue 3 integration for [Abby](https://docs.tryabby.com).

## Installation

```bash
pnpm add @tryabby/vue
```

## Usage

```ts
// abby.ts
import { createAbby } from "@tryabby/vue";

export const {
  AbbyProvider,
  useAbby,
  useFeatureFlag,
  useRemoteConfig,
  __abby__,
} = createAbby({
  projectId: "YOUR_PROJECT_ID",
  currentEnvironment: "production",
  environments: ["development", "production"],
  tests: {
    "signup-button": {
      variants: ["control", "variant-a"],
    },
  },
  flags: ["new-dashboard"],
  remoteConfig: {
    headline: "String",
  },
});
```

Wrap your application in the `AbbyProvider` component:

```vue
<script setup lang="ts">
import { AbbyProvider } from "./abby";
</script>

<template>
  <AbbyProvider>
    <RouterView />
  </AbbyProvider>
</template>
```

The provider can also be passed data that was fetched on the server, which
avoids a request on the client and makes the values available during SSR:

```vue
<AbbyProvider :initial-data="abbyData">
  <App />
</AbbyProvider>
```

## Composables

### `useAbby`

Returns the selected variant of an A/B test as a computed ref, plus an
`onAct` function that reports an action for the test.

```vue
<script setup lang="ts">
import { useAbby } from "./abby";

const { variant, onAct } = useAbby("signup-button");
// or map the variant to a value:
const { variant: buttonLabel } = useAbby("signup-button", {
  control: "Sign up",
  "variant-a": "Create account",
});
</script>

<template>
  <button @click="onAct">{{ buttonLabel }}</button>
</template>
```

Variant values are rendered as an empty string on the first render to avoid
SSR hydration mismatches. Once mounted, `variant.value` contains the
selected variant.

### `useFeatureFlag`

Returns the value of a feature flag as a computed ref.

```vue
<script setup lang="ts">
import { useFeatureFlag } from "./abby";

const showNewDashboard = useFeatureFlag("new-dashboard");
</script>

<template>
  <NewDashboard v-if="showNewDashboard" />
</template>
```

### `useRemoteConfig`

Returns the value of a remote config variable as a computed ref. The type of
the value is inferred from the remote config definition (`String`, `Number`
or `JSON`).

```vue
<script setup lang="ts">
import { useRemoteConfig } from "./abby";

const headline = useRemoteConfig("headline");
</script>

<template>
  <h1>{{ headline }}</h1>
</template>
```

## Other exports

`createAbby` also returns the following helpers:

- `useFeatureFlags()` - a computed ref containing all flags with their values
- `useRemoteConfigVariables()` - a computed ref containing all remote config values
- `getFeatureFlagValue(name)` - read a flag outside of a component
- `getRemoteConfig(name)` - read a remote config value outside of a component
- `getABTestValue(name, lookup?)` - read a test variant outside of a component
- `getVariants(name)` - all variants of a test
- `getABResetFunction(name)` - reset the persisted variant of a test
- `updateUserProperties(user)` - update the user properties used for rules
- `__abby__` - the underlying `Abby` instance
