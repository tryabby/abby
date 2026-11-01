# @tryabby/vue

Typed Vue composables for Abby feature flags, remote configuration, and A/B tests. This workspace implementation uses `@tryabby/core` and requires **Vue 3.5 or newer**. It does not require a single-file-component compiler.

## Install on a Vue application

```ts
// abby.ts
import { createAbby } from "@tryabby/vue";

export const sdk = createAbby({
  projectId: "your-public-project-id",
  environments: ["production"],
  currentEnvironment: "production",
  flags: ["showDetails"],
  tests: { welcome: { variants: ["calm", "bright"] } },
  remoteConfig: { headline: "String", previewCount: "Number", appearance: "JSON" },
  cookies: { disableByDefault: true },
});
```

```ts
// main.ts
import { createApp } from "vue";
import App from "./App.vue";
import { sdk } from "./abby";

const app = createApp(App);
app.use(sdk.AbbyPlugin); // Loads public project data on the client after mount.
app.mount("#app");
```

If the host already has public project data, pass `{ initialData }` as the second argument to `app.use`. Its shape is `AbbyDataResponse` from `@tryabby/core`:

```ts
const initialData = {
  tests: [{ name: "welcome", weights: [1, 0] }],
  flags: [{ name: "showDetails", value: true }],
  remoteConfig: [
    { name: "headline", value: "Welcome back" },
    { name: "previewCount", value: 3 },
    { name: "appearance", value: { tone: "mint" } },
  ],
};
app.use(sdk.AbbyPlugin, { initialData }); // Skips the automatic data request.
// Equivalent plugin form: app.use(sdk, { initialData }).
```

An isolated subtree can instead render `sdk.AbbyProvider` with an optional `initialData` prop. Composables in its descendants use that provider's separate core. Create the component using `h(sdk.AbbyProvider, { initialData }, { default: () => h(Child) })`, or bind the returned component in a Vue template. Do not call a descendant composable in the parent's setup before the provider exists.

## Reactive component values

Call composables synchronously in a component's `setup()` or `<script setup>`, beneath the installed plugin or provider:

```vue
<script setup lang="ts">
import { sdk } from "./abby";

const showDetails = sdk.useFeatureFlag("showDetails"); // ComputedRef<boolean>
const headline = sdk.useRemoteConfig("headline");     // ComputedRef<string>
const previewCount = sdk.useRemoteConfig("previewCount"); // ComputedRef<number>
const appearance = sdk.useRemoteConfig("appearance"); // ComputedRef<Record<string, unknown>>
const { variant, onAct } = sdk.useAbby("welcome");
// variant: ComputedRef<"calm" | "bright" | undefined>
</script>

<template>
  <h1>{{ headline }}</h1>
  <p v-if="showDetails">Showing {{ previewCount }} items.</p>
  <button :disabled="variant === undefined" @click="onAct">
    {{ variant ?? "Loading experience" }}
  </button>
</template>
```

Vue templates unwrap refs. In JavaScript, use `.value` inside a render function or computed expression; copying `.value` into a plain variable loses reactivity. A lookup maps each literal variant to another typed value:

```ts
const { variant: buttonText, onAct } = sdk.useAbby("welcome", {
  calm: "Take a look",
  bright: "Explore now",
});
```

`useFeatureFlags()` and `useRemoteConfigVariables()` return computed lists. `useAbby()` emits PING when a mounted selection becomes available or changes; `onAct()` sends ACT for the current raw variant, including when a lookup is used. Neither sends during SSR or before mount. The real SDK uses the core's telemetry transport; the local demo intercepts it separately.

## Imperative access and updates

Getters return snapshots, not refs. They resolve the nearest runtime in setup. Outside injection context, pass the **installed Vue app** explicitly; there is no implicit global client:

```ts
// In setup:
const client = sdk.useAbbyClient();
const choices = sdk.getVariants("welcome");
const resetWelcome = sdk.getABResetFunction("welcome");

// Safe to use the captured client in a later component event handler:
const toggle = () => client.updateFlag("showDetails", !client.getFeatureFlag("showDetails"));

// Outside setup, after plugin installation:
sdk.getFeatureFlagValue("showDetails", app);
sdk.getRemoteConfig("headline", app);
sdk.getABTestValue("welcome", undefined, app); // undefined until client mount
sdk.getABTestValue("welcome", { calm: "A", bright: "B" }, app);
sdk.getVariants("welcome", app);
sdk.getABResetFunction("welcome", app)();
sdk.useAbbyClient(app);
```

`updateUserProperties(properties, app?)` accepts properties declared by the core config's `user` validators and recalculates rules. `enableCookies(app?)`, `disableCookies(app?)`, and `loadProjectData(app?)` also resolve an injected runtime or the explicit app. Prefer the SDK cookie helpers over direct core consent calls so Vue snapshots and storage cleanup stay coordinated.

The exposed core supports `init`, `updateFlag`, `updateRemoteConfig`, and other existing core methods; notifications update mounted composables. `updateLocalVariant` is a **development override** in core, not a production experiment-assignment API. `withDevtools(factory, options?)` accepts a factory with `create({ abby, ...options })` returning an optional cleanup function; it does not add a devtools UI dependency. It shows only in development unless `dangerouslyForceShow` is enabled.

## SSR, Nuxt, cookies, and cleanup

- Every app installation and every provider owns a distinct core and cloned configuration/data. Never place a mutable per-request core or user properties in a server singleton.
- A/B variants are `undefined` during SSR and the initial hydration render, then become available after client mount. Render the same placeholder on both sides. Feature flags and remote configuration use the supplied initial data or configured defaults.
- SSR does not automatically fetch, access browser storage, or send events. Without initial data, the client loads project data after mount. With initial data, give server and client the same public payload.
- Variant persistence uses project-scoped cookies when enabled. Configure consent for your application; `disableCookies` clears this runtime's known values and records disabled consent. Reset helpers clear the selected test's stored assignment; they do not promise a different next variant. No HttpOnly cookie can be read by this client SDK.
- Component/effect-scope subscriptions stop on disposal. Provider unmount and `app.unmount()` dispose their owned runtimes; devtools cleanup runs on unmount. Do not keep using a disposed runtime.

This is a **Nuxt plugin integration example**, not a shipped Nuxt module or a claim that a Nuxt application test suite has run:

```ts
// plugins/abby.ts — runs once for each Nuxt app/request, not at module scope.
import { defineNuxtPlugin, useState } from "#app";
import type { AbbyDataResponse } from "@tryabby/core";
import { createAbby } from "@tryabby/vue";

export default defineNuxtPlugin((nuxtApp) => {
  const sdk = createAbby({
    projectId: "your-public-project-id",
    environments: ["production"],
    currentEnvironment: "production",
    flags: ["showDetails"],
    tests: { welcome: { variants: ["calm", "bright"] } },
    remoteConfig: { headline: "String" },
    cookies: { disableByDefault: true },
  });

  // A host-controlled server loader may populate this with public Abby data.
  // useState serializes it for hydration: never put secrets/user profiles here.
  const initialData = useState<AbbyDataResponse | null>("abby-public-data", () => null);
  nuxtApp.vueApp.use(sdk.AbbyPlugin, initialData.value
    ? { initialData: initialData.value }
    : {}); // No payload: client fetches after mount; server does not fetch.
  return { provide: { abby: sdk } };
});
```

In a Nuxt component's setup, obtain `const { $abby } = useNuxtApp()` and call `$abby.useFeatureFlag(...)`, `$abby.useAbby(...)`, or the other composables. Server-provided flags are presentation configuration, not authorization: enforce privileged access on your server.

## Run the local demonstration

The [public synthetic-data playground](https://microusada.com/demos/abby-vue/)
and its [26-second browser-captured walkthrough](https://microusada.com/demos/abby-vue/walkthrough.mp4)
show the same demonstration. The video is a captioned sequence of actual browser
captures, not a recording of a live Abby project or a claim about network performance.

From the repository root, with workspace dependencies already installed:

```sh
pnpm --filter @tryabby/core build
pnpm --filter @tryabby/vue demo
```

Open the local URL printed by Vite. The demo imports `src/index.ts` and uses real Vue `createApp`/`h`, without a Vue SFC plugin. `index.html` is also the Vite production entry; a local static build can be made with `pnpm --filter @tryabby/vue exec vite build`. That builds the demo, while `pnpm --filter @tryabby/vue build` builds the SDK package.

The demo contains only synthetic initial data. It intercepts the same `@tryabby/core` `HttpService.sendData` used by the SDK, stores events in memory, and disables project loading before plugin installation. Its page CSP additionally blocks connection requests, including Vite's development HMR WebSocket. App files still load from your local HTTP server; no Abby API, telemetry, fonts, CDN, account, or key is required. This instrumentation is demonstration-only and is **not installed by the SDK**.

Suggested manual checks, rather than a claim that they have already run:

1. Toggle the flag and change string, number, and JSON configuration; verify the actual preview DOM updates.
2. Switch the synthetic A/B weights; verify the variant label changes and a local PING appears.
3. Click “Try this experience”; verify an ACT with the selected raw variant appears.
4. Unmount and remount the panel; check that the app remains reactive without accumulating obsolete subscriptions.
5. Inspect the Network panel: local assets only, no external API or telemetry. The project-data attempt counter should remain zero.

## Development checks

```sh
pnpm --filter @tryabby/vue typecheck
pnpm --filter @tryabby/vue test
pnpm --filter @tryabby/vue build
pnpm --filter @tryabby/core exec vitest run
pnpm --filter @tryabby/react exec vitest run
pnpm --filter @tryabby/svelte exec vitest run
```

These are reproduction commands, not a declaration that every command or framework application has passed in every environment. The Vue package includes runtime, SSR-isolation/lifecycle, and TypeScript contract checks; consult the actual test output for the tested scope.

This integration and its demonstration are original, AI-assisted contributions. The contributor is responsible for reviewing and validating the final change before upstream submission. No implementation from competing pull requests was copied. Repository licensing applies; inclusion of this package does not guarantee bounty acceptance or payout eligibility.
