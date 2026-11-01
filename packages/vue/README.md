# @tryabby/vue

Vue 3 composables backed by @tryabby/core.

    import { createAbby } from "@tryabby/vue";
    export const {
      AbbyProvider, useAbby, useFeatureFlag, useRemoteConfig,
      useAbbyClient, useAbbyStatus,
    } = createAbby({
      projectId: "your-project",
      environments: ["production"],
      currentEnvironment: "production",
      tests: { heading: { variants: ["short", "long"] } },
      flags: ["banner"],
      remoteConfig: { title: "String", limit: "Number" },
    });

Wrap the consuming component tree in the returned provider:

    <script setup lang="ts">
    import { AbbyProvider } from "./abby";
    </script>
    <template>
      <AbbyProvider><RouterView /></AbbyProvider>
    </template>

Inside a descendant's setup:

    const { variant, onAct } = useAbby("heading");
    const banner = useFeatureFlag("banner"); // ComputedRef<boolean>
    const title = useRemoteConfig("title");  // ComputedRef<string>
    const limit = useRemoteConfig("limit");  // ComputedRef<number>
    const ready = useAbbyStatus();           // ComputedRef<boolean>
    const client = useAbbyClient();          // typed core instance
    const { variant: heading } = useAbby("heading", {
      short: "Welcome",
      long: "Welcome to the application",
    });

Names accept a plain value, a Vue ref, or a getter. Changing a name changes the
selected value and the test name used by onAct. Variant names, feature flags
and remote config names are inferred from configuration; incomplete lookup
objects and unknown names are TypeScript errors.

The variant is undefined until the provider is mounted and data loading has
completed. This gives server rendering and the initial hydration render the
same placeholder. Use a loading branch in templates. Flags and remote configs
use core's configured defaults while loading. The core transport falls back
to defaults on fetch failure; unexpected provider loading errors are emitted
through the provider's error event.

An optional initialData provider prop accepts an AbbyDataResponse, skips the
initial HTTP request, and can be populated by a Nuxt useAsyncData call. Pass the
same response during server rendering and hydration. No Nuxt module is required
or supplied. Each provider owns its core instance and mutable configuration:
module-level createAbby calls do not share user state between SSR requests.

The provider subscribes once and unsubscribes on scope disposal. Cookie-backed
variant persistence uses core's project-specific storage keys and respects
cookies.disableByDefault and expiry options. The typed core instance exposes
the existing consent, user-property and local override APIs. Development-only
core behavior remains development-only. PING and ACT use the same transport as
the existing integrations, including its localhost suppression.

## Validation

From the workspace root:

    pnpm --filter @tryabby/core build
    pnpm --filter @tryabby/vue typecheck
    pnpm --filter @tryabby/vue test
    pnpm --filter @tryabby/vue build
    pnpm --filter @tryabby/vue exec vite --host 127.0.0.1 --port 5181

Open /examples/ for the local reactive demo. It uses synthetic initial data;
it does not require a real Abby project or credentials. Tests cover the actual
core, Vue component lifecycle, events, reactive names, cookie consent,
provider isolation, SSR, and compile-time public types. No optional Vue
devtools panel or Nuxt plugin is included.
