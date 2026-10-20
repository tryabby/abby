# @tryabby/vue

Vue 3 (and Nuxt) integration for [Abby](https://tryabby.com) - A/B Testing & Feature Flags.

## Installation

```bash
npm install @tryabby/vue vue
# or
pnpm add @tryabby/vue vue
```

## Setup

Define your Abby configuration:

```typescript
// abby.ts
import { createAbby } from "@tryabby/vue";

export const {
  useAbby,
  useFeatureFlag,
  useRemoteConfig,
  getFeatureFlagValue,
  getRemoteConfig,
  getABTestValue,
  AbbyProvider,
  AbbyPlugin,
} = createAbby({
  projectId: "YOUR_PROJECT_ID",
  currentEnvironment: process.env.NODE_ENV === "production" ? "production" : "development",
  tests: {
    heroTest: {
      variants: ["headlineA", "headlineB"],
    },
  },
  flags: ["newDashboard"],
  remoteConfig: {
    bannerText: "String",
  },
});
```

## Usage

### A/B Testing (`useAbby`)

```vue
<script setup lang="ts">
import { useAbby } from "./abby";

const { variant, onAct } = useAbby("heroTest");

const handleClick = () => {
  onAct();
};
</script>

<template>
  <div>
    <h1 v-if="variant === 'headlineA'">Welcome to Version A!</h1>
    <h1 v-else>Welcome to Version B!</h1>
    <button @click="handleClick">Call to Action</button>
  </div>
</template>
```

With lookup objects:

```typescript
const { variant } = useAbby("heroTest", {
  headlineA: "Super Header A",
  headlineB: "Super Header B",
});
// variant.value is typed as string ("Super Header A" | "Super Header B")
```

### Feature Flags (`useFeatureFlag`)

```vue
<script setup lang="ts">
import { useFeatureFlag } from "./abby";

const isNewDashboard = useFeatureFlag("newDashboard");
</script>

<template>
  <NewDashboard v-if="isNewDashboard" />
  <OldDashboard v-else />
</template>
```

### Remote Config (`useRemoteConfig`)

```vue
<script setup lang="ts">
import { useRemoteConfig } from "./abby";

const banner = useRemoteConfig("bannerText");
</script>

<template>
  <p>{{ banner }}</p>
</template>
```
