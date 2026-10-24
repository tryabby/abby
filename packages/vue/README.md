# @tryabby/vue

Typed Vue 3 composables for Abby A/B tests, feature flags and remote configuration.

```sh
pnpm add @tryabby/vue
```

Create an instance with the same configuration used by the other Abby integrations:

```ts
// abby.ts — a client-only app can export this instance.
import { createAbby } from "@tryabby/vue";

export const abby = createAbby({
  projectId: "YOUR_PROJECT_ID",
  environments: ["production"],
  currentEnvironment: "production",
  tests: { checkout: { variants: ["original", "fresh"] } },
  flags: ["premium"],
  remoteConfig: { headline: "String", price: "Number", theme: "JSON" },
  user: { role: { type: "string" } },
});
```

Wrap the application in that instance's provider:

```vue
<script setup lang="ts">
import { abby } from "./abby";
const { AbbyProvider } = abby;
</script>

<template><AbbyProvider><RouterView /></AbbyProvider></template>
```

Consume reactive values inside a descendant's `setup()`:

```vue
<script setup lang="ts">
import { abby } from "./abby";
const { variant, onAct } = abby.useAbby("checkout");
const premium = abby.useFeatureFlag("premium");
const headline = abby.useRemoteConfig("headline");
</script>

<template>
  <h1>{{ headline }}</h1>
  <button v-if="variant" type="button" @click="onAct">{{ variant }}</button>
  <p v-if="premium">Premium feature enabled</p>
</template>
```

Composables return readonly computed refs: use `.value` in TypeScript; Vue unwraps them in templates. Names accept a string, ref or getter. Variant values remain `undefined` during SSR and initial hydration, then resolve after the provider mounts and loads data. A view event is sent when the selected test/variant changes; `onAct()` sends a conversion for the current selection. Both use core's telemetry behavior, including its localhost suppression.

`useAbby("checkout", { original: "Buy", fresh: "Try now" })` maps every variant to a typed value. Missing lookup keys and unknown names are TypeScript errors.

## API

| Member | Result / behavior |
| --- | --- |
| `useAbby(name, lookup?)` | `{ variant: ComputedRef<VariantOrLookupValue \| undefined>, onAct }` |
| `useFeatureFlag(name)` | `ComputedRef<boolean>` |
| `useRemoteConfig(name)` | A computed string, number or JSON object, inferred from config |
| `useFeatureFlags()` / `useRemoteConfigVariables()` | Computed arrays of `{ name, value }` |
| `getFeatureFlagValue(name)` / `getRemoteConfig(name)` | Nonreactive values outside component setup |
| `getABTestValue(name, lookup?)` | Current variant or mapped value; retains the assignment within this instance |
| `getVariants(name)` | The configured readonly variant tuple |
| `getABResetFunction(name)` | Removes the saved assignment; takes effect on the next page load |
| `updateUserProperties(properties)` | Validates a partial user update and refreshes targeting |
| `enableCookies()` / `disableCookies()` | Changes assignment consent; revocation removes assignment cookies |
| `loadProjectData()` | Explicit refresh, with concurrent fetches shared |
| `__abby__` | The underlying core instance, also used by devtools |
| `withDevtools(factory, props)` | Vue component that creates and destroys the existing devtools |

The provider accepts `initialData?: AbbyDataResponse`, `cookies?: string` (an SSR request's cookie header), and typed `userProperties`. With initial data it makes no initial network request. Otherwise it fetches centrally on mount. Configured defaults/fallbacks cover failed requests and absent flags/config variables. Updates to `initialData` or `userProperties` propagate to descendants. Provider teardown removes its subscription; unmounted consumers stop emitting events.

Cookie names and expiry follow core's existing conventions. Assignments stay stable in memory if the browser cannot persist cookies. Set `cookies: { disableByDefault: true }` to start without assignment cookies, then call `enableCookies()` after consent. This setting governs storage; it does not disable core's event transport. `disableCookies()` records the consent preference and removes assignment cookies. Flag/config overrides keep core semantics.

## SSR and Nuxt

**Create a fresh instance per app and per server request.** Do not share a mutable SDK instance in a server module. Reusing one instance across SSR apps raises an error instead of sharing user state. The input config can be shared; each instance copies the mutable test/consent configuration.

Pass the same fetched `initialData` to server rendering and hydration. Feature flags and remote config can render on the server; A/B content remains pending until client mount, avoiding a randomly selected hydration mismatch. Pass the request cookie header only to the server's provider when using existing assignments/overrides. Do not serialize an entire request cookie header into public HTML.

A Nuxt plugin is a suitable place to create the request-local instance:

For the typed server fetch below, also install core as a direct dependency: `pnpm add @tryabby/core`.

```ts
// plugins/abby.ts
import { createAbby } from "@tryabby/vue";
import config from "~/abby.config";

export default defineNuxtPlugin(() => ({
  provide: { abby: createAbby(config) },
}));
```

```vue
<!-- app.vue -->
<script setup lang="ts">
import type { AbbyDataResponse } from "@tryabby/core";
const { $abby } = useNuxtApp();
const { AbbyProvider } = $abby;
const { data } = await useAsyncData("abby-project", () =>
  $fetch<AbbyDataResponse>(
    "https://www.tryabby.com/api/v2/data/YOUR_PROJECT_ID?environment=production"
  )
);
const cookies = import.meta.server ? useRequestHeaders(["cookie"]).cookie : undefined;
</script>

<template>
  <AbbyProvider :initial-data="data ?? undefined" :cookies="cookies">
    <NuxtPage />
  </AbbyProvider>
</template>
```

Descendants call `useNuxtApp().$abby.useFeatureFlag(...)`, and so on. This is a Nuxt usage recipe, not an auto-installed Nuxt module.

## Devtools

```ts
import Devtools from "@tryabby/devtools";
const AbbyDevtools = abby.withDevtools(Devtools, { defaultShow: true });
```

Render `<AbbyDevtools />` once. It initializes on mount in development and cleans up on unmount. `dangerouslyForceShow: true` explicitly enables it in other environments; do not expose it to production users by accident. The devtools package is optional and is not bundled with this SDK.

## Development and local demo

From the repository root, the test command builds core and this package before running the runtime and type checks:

```sh
pnpm --filter @tryabby/vue test
pnpm --filter @tryabby/vue demo:build
node packages/vue/demo/serve.mjs
```

Open `http://127.0.0.1:8766`. The demo uses the built package with a labelled local fixture, and shows PING/ACT events received by its local server. It does not contact the hosted Abby backend. Use “Target admin user” before manually toggling the flag, since a manual override takes precedence over targeting.
