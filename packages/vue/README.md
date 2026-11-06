# `@tryabby/vue`

Typed Vue 3 composables for Abby A/B tests, feature flags, and remote config.

```ts
import { createAbby } from "@tryabby/vue";

export const abby = createAbby({
  projectId: "project-id",
  environments: ["development", "production"],
  currentEnvironment: "development",
  tests: { checkout: { variants: ["control", "new"] } },
  flags: ["newNav"],
  remoteConfig: { headline: "String" },
});
```

Wrap the application (or a Nuxt layout) in the returned provider:

```vue
<script setup lang="ts">
import { abby } from "./abby";
</script>

<template>
  <abby.AbbyProvider><NuxtPage /></abby.AbbyProvider>
</template>
```

Use the typed composables in descendants. Values are Vue computed refs and are automatically unwrapped in templates.

```vue
<script setup lang="ts">
import { abby } from "./abby";

const { variant, onAct } = abby.useAbby("checkout");
const newNav = abby.useFeatureFlag("newNav");
const headline = abby.useRemoteConfig("headline");
</script>
```

For SSR, pass server-loaded `AbbyDataResponse` as `initialData`. A/B variants intentionally render empty until client mount to avoid hydration mismatches; hydrated feature flags and remote config can render on the server.
