# @tryabby/vue

Vue 3 bindings for [Abby](https://tryabby.com), the open source A/B testing, feature flagging and remote config platform.

## Installation

```bash
npm install @tryabby/vue @tryabby/core
```

## Setup

Create an `abby.ts` file, just like you would with the React integration:

```ts
import { createAbby } from "@tryabby/vue";
import { defineConfig } from "@tryabby/core";

export const abby = createAbby(
  defineConfig({
    projectId: "YOUR_PROJECT_ID",
    currentEnvironment: process.env.NODE_ENV,
    environments: ["development", "production"],
    tests: {
      Footer: { variants: ["Old", "New"] },
    },
    flags: ["NewFooter"],
    remoteConfig: {
      ButtonColor: "string",
    },
  })
);
```

Then wrap your app in the `AbbyProvider`:

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

For SSR (for example with Nuxt) pass the data you fetched on the server as
`initialData`, so the first client render matches the server render:

```vue
<AbbyProvider :initialData="abbyData">
  <NuxtPage />
</AbbyProvider>
```

## Usage

### AB Tests

```vue
<script setup lang="ts">
import { useAbby } from "./abby";
import { abby } from "./abby";

const { variant, onAct } = useAbby("Footer", {
  Old: "subscribe to the newsletter",
  New: "buy our product",
});

onAct(); // optional: report that the variant has been used
</script>

<template>
  <p>{{ variant }}</p>
</template>
```

`variant` is a computed ref, so it automatically updates when the project data
changes or when the AB test is reset through the devtools.

### Feature Flags

```vue
<script setup lang="ts">
import { useFeatureFlag } from "./abby";

const isEnabled = useFeatureFlag("NewFooter");
</script>

<template>
  <NewFooter v-if="isEnabled" />
</template>
```

### Remote Config

```vue
<script setup lang="ts">
import { useRemoteConfig } from "./abby";

const buttonColor = useRemoteConfig("ButtonColor");
</script>

<template>
  <button :style="{ backgroundColor: buttonColor }" />
</template>
```

## Non reactive getters

Besides the composables, `createAbby` also exposes non reactive getters that
can be used outside of the setup function (for example in event handlers):
`getFeatureFlagValue`, `getABTestValue`, `getRemoteConfig`, `getVariants`,
`getABResetFunction` and `updateUserProperties`.

## Testing

```bash
pnpm --filter @tryabby/vue test
pnpm --filter @tryabby/vue build
```
