# @tryabby/vue

Vue 3 composables for Abby A/B tests, feature flags and remote configuration.
Uses `@tryabby/core` for data loading, targeting, defaults and variant selection.

## Configure

```ts
// abby.ts (a browser-only application)
import { createAbby } from "@tryabby/vue";

export const {
  AbbyProvider,
  useAbby,
  useFeatureFlag,
  useRemoteConfig,
} = createAbby({
  projectId: "your-project-id",
  environments: ["development", "production"],
  currentEnvironment: "development",
  tests: { checkout: { variants: ["classic", "compact"] } },
  flags: ["banner"],
  remoteConfig: { title: "String", limit: "Number" },
});
```

Wrap the components that consume these composables in the provider from the
**same factory call**:

```vue
<!-- App.vue -->
<script setup lang="ts">
import { AbbyProvider } from "./abby";
import Checkout from "./Checkout.vue";
</script>

<template>
  <AbbyProvider><Checkout /></AbbyProvider>
</template>
```

```vue
<!-- Checkout.vue -->
<script setup lang="ts">
import { useAbby, useFeatureFlag, useRemoteConfig } from "./abby";

const { variant, onAct } = useAbby("checkout");
const banner = useFeatureFlag("banner");
const title = useRemoteConfig("title");
const limit = useRemoteConfig("limit");
</script>

<template>
  <p v-if="banner">{{ title }} — up to {{ limit }} items</p>
  <button v-if="variant" type="button" @click="onAct">
    {{ variant === "compact" ? "Buy now" : "Continue to checkout" }}
  </button>
</template>
```

The composables return read-only computed refs. Vue unwraps them in templates;
use `.value` in JavaScript. Call composables synchronously in component setup.
Their names are fixed for that component instance. Remount the consumer if its
configured key changes.

`variant.value` is `undefined` during SSR and before the initial client data has
loaded. It then narrows to the configured variants. An optional complete lookup
maps variants while preserving value types:

```ts
const { variant } = useAbby("checkout", { classic: "Continue", compact: "Buy now" });
// ComputedRef<"Continue" | "Buy now" | undefined>
```

Each mounted consumer reports an exposure when its selected variant changes.
`onAct()` reports a conversion for its current variant. Neither sends events
during SSR, before a variant exists, or after that consumer unmounts. Core's
existing localhost tracking suppression still applies.

## Initial data and SSR

`<AbbyProvider :initial-data="data">` accepts the core `AbbyDataResponse` shape
(`tests`, `flags`, `remoteConfig`) and skips its automatic fetch. Without initial
data, fetching begins on mount. The provider supports the same `apiUrl`, custom
`fetch`, environment and window bootstrap data as core. Network failures use
core's defaults. Core subscriptions update the refs and are removed on unmount;
an old provider's pending response cannot initialize its replacement.

**Create a new factory for each server request.** A factory owns mutable core
state, targeting properties and overrides. Do not export a server singleton or
share one between requests. Reusing an immutable configuration object to create
separate factories is supported. Use one provider per factory.

Pass the same initial data to server rendering and client hydration. Flags and
remote config render from that data; the variant remains absent until the client
mounts. Include an appropriate placeholder where the test will appear. Cookie
overrides and user targeting must also agree between server and client if they
affect server-rendered flags/config.

### Nuxt 4

Create the factory inside a universal Nuxt plugin: Nuxt runs it for each server
request and again for the client application. `useAsyncData` transfers only the
project data in the hydration payload; the factory and its mutable core state
stay in the current application. Do not give this plugin a `.client` suffix if
flags or remote configuration should render on the server.

```ts
// app/plugins/abby.ts
import type { AbbyDataResponse } from "@tryabby/core";
import { createAbby } from "@tryabby/vue";

export default defineNuxtPlugin(async () => {
  const abby = createAbby({
    projectId: "your-project-id",
    environments: ["production"],
    currentEnvironment: "production",
    tests: { checkout: { variants: ["classic", "compact"] } },
    flags: ["banner"],
    remoteConfig: { title: "String", limit: "Number" },
  });
  const { data, error } = await useAsyncData("abby-initial", () =>
    $fetch<AbbyDataResponse>("/api/abby")
  );
  if (error.value || !data.value) {
    throw createError({ statusCode: 503, statusMessage: "Abby data unavailable" });
  }
  return { provide: { abby, abbyInitialData: data.value } };
});
```

`/api/abby` is an endpoint supplied by your application, not by this package.
It must return the core `AbbyDataResponse` shape. Only return data suitable for
the browser; keep any service credentials in the server endpoint. Choose the
error policy appropriate for your application rather than passing missing data
to the provider unintentionally.

```vue
<!-- app/app.vue -->
<script setup lang="ts">
const { $abby, $abbyInitialData } = useNuxtApp();
const { AbbyProvider } = $abby;
</script>

<template>
  <AbbyProvider :initial-data="$abbyInitialData">
    <NuxtPage />
  </AbbyProvider>
</template>
```

Call the Abby composables in a descendant page or component's setup, where the
provider is available. They must not be called in the plugin or in `app.vue`
before its provider is rendered. Nuxt infers the injected factory's types:

```vue
<!-- app/pages/index.vue -->
<script setup lang="ts">
const { $abby } = useNuxtApp();
const banner = $abby.useFeatureFlag("banner");
const title = $abby.useRemoteConfig("title");
const { variant, onAct } = $abby.useAbby("checkout");
</script>

<template>
  <p v-if="banner">{{ title }}</p>
  <button v-if="variant" type="button" @click="onAct">{{ variant }}</button>
</template>
```

The variant still waits until client mount, as described above. Cookie overrides
and user targeting need the same server/client handling as other SSR consumers.
This is a plugin recipe, not a Nuxt module or global Abby auto-imports.

## Other helpers

The factory also provides `useFeatureFlags()` and `useRemoteConfigVariables()`
as computed lists, plus `getFeatureFlagValue`, `getRemoteConfig`,
`getABTestValue`, `getVariants`, `getABResetFunction` and
`updateUserProperties`. These non-composable helpers retain configured key and
value types. `__abby__` exposes the underlying core instance for explicit
reloads and existing core tooling. `defineConfig` is re-exported from core.

Test cookies use the same project-prefixed names as the other integrations and
honor `cookies.disableByDefault` and `cookies.expiresInDays`. Saved consent is
read before initializing or refreshing variant cookies. No browser storage is
accessed on the server.

With `cookies.disableByDefault: true`, removing saved consent disables cookie
writes when a provider from the same factory remounts. A new grant through
`__abby__.enableCookies()` saves consent and enables persistence again. Removing
consent does not erase existing variant cookies, and external cookie changes
are not watched while the provider stays mounted.

### Devtools

```ts
import devtools from "@tryabby/devtools";

const AbbyDevtools = abby.withDevtools(devtools, { position: "bottom-right" });
// Render <AbbyDevtools /> in the application's template.
```

Install `@tryabby/devtools` separately if using it. Options are inferred from
the supplied factory, so this integration does not require loading the devtools
bundle otherwise. The component creates devtools on mount in development and
calls their cleanup function on unmount. It renders nothing during SSR.
`dangerouslyForceShow: true` explicitly enables it outside development.

## Local verification and example

From the repository root, with Node 22 and pnpm 9.9.0:

```sh
pnpm --filter @tryabby/vue... install --frozen-lockfile
pnpm --filter @tryabby/core build
pnpm --filter @tryabby/vue test
pnpm --filter @tryabby/vue build
pnpm --filter @tryabby/vue example
```

`test` runs runtime tests followed by `tsc --noEmit`, including positive
inference assertions and rejected invalid names, lookups and writes. Tests
cover SSR, hydration, targeting, cookie consent, late consumers, cleanup,
stale requests and devtools lifecycle.

Open `http://127.0.0.1:4178`. The example consumes the built package and serves
synthetic project data from its local Vite middleware. **Change server data**
loads alternate flags/config/weights. **Record conversion**, then **Read
events**, shows the server's received exposure/conversion payloads. This makes
no calls to an Abby account and uses no customer data.
