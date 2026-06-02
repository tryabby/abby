# @tryabby/vue

Vue integration for Abby feature flags, A/B tests, and remote config.

## Installation

```sh
pnpm add @tryabby/vue
```

## Usage

```ts
import { createAbby } from "@tryabby/vue";

const { AbbyProvider, useAbby, useFeatureFlag, useRemoteConfig } = createAbby({
  projectId: "project-id",
  environments: ["development", "production"],
  currentEnvironment: "development",
  tests: {
    headline: {
      variants: ["short", "long"],
    },
  },
  flags: ["newCheckout"],
  remoteConfig: {
    buttonText: "String",
  },
});
```

Wrap your app with `AbbyProvider`:

```vue
<template>
  <AbbyProvider>
    <App />
  </AbbyProvider>
</template>
```

Use Abby composables inside components:

```ts
const { variant, onAct } = useAbby("headline");
const enabled = useFeatureFlag("newCheckout");
const buttonText = useRemoteConfig("buttonText");
```
