# @tryabby/vue

Vue integration for [Abby](https://tryabby.com): feature flags, remote config and A/B tests with full type safety. Works with Vue 3.5+ and Nuxt.

## Installation

```bash
npm i @tryabby/vue
```

## Usage

```ts
// abby.ts
import { createAbby } from "@tryabby/vue";

export const { AbbyPlugin, useAbby, useFeatureFlag, useRemoteConfig } =
  createAbby({
    projectId: "<YOUR_PROJECT_ID>",
    currentEnvironment: "production",
    environments: ["production", "development"],
    tests: { footer: { variants: ["dark", "orange", "green"] } },
    flags: ["newFeature"],
    remoteConfig: { customButtonText: "String" },
  });
```

```ts
// main.ts
createApp(App).use(AbbyPlugin).mount("#app");
```

```vue
<script setup lang="ts">
import { useAbby, useFeatureFlag, useRemoteConfig } from "./abby";

const { variant, onAct } = useAbby("footer");
const hasNewFeature = useFeatureFlag("newFeature");
const buttonText = useRemoteConfig("customButtonText");
</script>

<template>
  <p v-if="hasNewFeature">Here is the new feature</p>
  <button :class="variant" @click="onAct">{{ buttonText }}</button>
</template>
```

All composables return computed refs. Check out the [documentation](https://docs.tryabby.com/integrations/vue) for the full API, the devtools and the Nuxt setup.
