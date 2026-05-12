# @tryabby/vue

Vue integration for Abby A/B tests, feature flags, and remote config.

```ts
import { createAbby } from "@tryabby/vue";

export const abby = createAbby({
  projectId: "project-id",
  currentEnvironment: "production",
  environments: ["production"],
  tests: {
    buttonCopy: { variants: ["control", "short"] },
  },
  flags: ["checkout"],
  remoteConfig: {
    headline: "String",
  },
});
```

Wrap your app with `AbbyProvider`, then call the composables from child components.

```ts
const { variant, onAct } = abby.useAbby("buttonCopy");
const checkoutEnabled = abby.useFeatureFlag("checkout");
const headline = abby.useRemoteConfig("headline");
```
