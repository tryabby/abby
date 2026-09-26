# @tryabby/vue

Vue 3 SDK for Abby. Consumes `@tryabby/core`.

## Acceptance (GitHub issue #68)

- Package lives in `packages/vue`
- Package name is `@tryabby/vue`
- Consumes `@tryabby/core`
- TypeScript, same type quality as the React SDK
- `useAbby` → current variant + `onAct`
- `useFeatureFlag` → flag value
- `useRemoteConfig` → remote config value
- Tests for types and code

## Usage

```ts
import { createAbby } from "@tryabby/vue";

export const { useAbby, useFeatureFlag, useRemoteConfig, AbbyProvider, install } =
  createAbby({
    projectId: "…",
    environments: ["production"],
    currentEnvironment: "production",
    tests: { homepage: { variants: ["A", "B"] } },
    flags: ["newCheckout"],
    remoteConfig: { heroCopy: "String" },
  });
```
