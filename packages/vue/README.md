# @tryabby/vue

Vue integration for Abby.

```ts
import { createAbby } from "@tryabby/vue";

export const { AbbyPlugin, useAbby, useFeatureFlag, useRemoteConfig } =
  createAbby({
    projectId: "YOUR_PROJECT_ID",
    currentEnvironment: "production",
    environments: ["production"],
    tests: {
      headline: {
        variants: ["control", "variant"],
      },
    },
    flags: ["newCheckout"],
    remoteConfig: {
      ctaText: "String",
    },
  });
```

Install the plugin in your Vue app:

```ts
import { createApp } from "vue";
import App from "./App.vue";
import { AbbyPlugin } from "./abby";

createApp(App).use(AbbyPlugin).mount("#app");
```

Use Abby inside Vue components:

```ts
import { useAbby, useFeatureFlag, useRemoteConfig } from "./abby";

const { variant, onAct } = useAbby("headline");
const newCheckout = useFeatureFlag("newCheckout");
const ctaText = useRemoteConfig("ctaText");
```
