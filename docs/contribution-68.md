# Vue Integration for **Abby** (with optional Nuxt support)

> **Goal** – Provide a first‑class Vue (and Nuxt) integration that mirrors the existing React SDK in feature set, ergonomics, and API surface.  
> **Target audience** – Front‑end developers using Vue 2, Vue 3, and Nuxt 2/3 who want to use Abby for feature flags, A/B tests, or remote configuration.

---

## Table of Contents

1. [High‑level Architecture](#high-level-architecture)  
2. [Package Layout & Distribution](#package-layout--distribution)  
3. [Core Public API](#core-public-api)  
4. [Installation & Setup](#installation--setup)  
5. [Vue 2 Integration](#vue-2-integration)  
6. [Vue 3 Integration (Composition API)](#vue-3-integration-composition-api)  
7. [Nuxt Module (v2 & v3)](#nuxt-module)  
8. [SSR / Hydration Considerations](#ssr--hydration-considerations)  
9. [TypeScript Types](#typescript-types)  
10. [Testing Strategy](#testing-strategy)  
11. [CI/CD & Release Process](#cicd--release-process)  
12. [Documentation & Examples](#documentation--examples)  
13. [Migration Guide from React SDK](#migration-guide-from-react-sdk)  
14. [Future Enhancements](#future-enhancements)  

---

## 1. High‑level Architecture

```
@abby/vue
│
├─ src/
│   ├─ core/                 ← thin wrapper around @abby/core (shared engine)
│   │   └─ AbbyClient.ts      ← re‑export of core client with Vue‑specific helpers
│   ├─ vue2/
│   │   ├─ plugin.ts          ← Vue 2 plugin (install method)
│   │   └─ mixin.ts           ← optional global mixin for $abby
│   ├─ vue3/
│   │   ├─ plugin.ts          ← Vue 3 plugin (app.use)
│   │   └─ composables/
│   │        └─ useAbby.ts    ← Composition API helper
│   ├─ nuxt/
│   │   ├─ module.ts          ← Nuxt 2 & 3 module entry
│   │   └─ runtime/           ← runtime config + composable for Nuxt 3
│   └─ utils/
│        └─ logger.ts
│
├─ types/                    ← public .d.ts files
├─ index.ts                  ← barrel export (plugin + client)
├─ package.json
├─ tsconfig.json
└─ README.md
```

* **Core** – We do **not** duplicate Abby’s flag‑evaluation engine; we import `@abby/core` (the same library used by the React SDK). The Vue wrapper only adds reactive bindings and Vue‑specific lifecycle handling.  
* **Reactivity** – Expose flags as **computed refs** (Vue 3) or **Vue.observable** objects (Vue 2) so UI updates automatically when flags change.  
* **SSR** – For Nuxt we pre‑fetch flag values on the server and inject a *hydrated* client into the Vue app to avoid a “flash of default” (FOU).  

---

## 2. Package Layout & Distribution

| Artifact | NPM name | Entry point | Build format |
|----------|----------|--------------|--------------|
| Vue 2 & 3 bundle | `@abby/vue` | `dist/index.esm.js` (ESM) + `dist/index.cjs.js` (CJS) | Rollup (tsc + Babel) |
| Types | `@abby/vue` | `dist/index.d.ts` | `declaration: true` |
| Optional Nuxt module | `@abby/nuxt` (peer‑dependency) | `dist/nuxt/module.cjs.js` | Same as above (published together) |

* **Peer dependencies** – `vue@^2.6.0 || ^3.0.0`, `nuxt@^2.15.0 || ^3.0.0`.  
* **Bundling** – Use Rollup with `@rollup/plugin-node-resolve`, `@rollup/plugin-commonjs`, and `rollup-plugin-typescript2`.  
* **Tree‑shaking** – Export only what the consumer imports (`createAbby`, `useAbby`, `AbbyPlugin`).  

---

## 3. Core Public API (Feature Parity with React)

| React SDK | Vue SDK Equivalent | Description |
|-----------|--------------------|-------------|
| `AbbyProvider` | `AbbyPlugin` (install) | Global provider that injects `abby` client into Vue app. |
| `useAbby()` | `useAbby()` (Vue 3) / `this.$abby` (Vue 2) | Hook/composable to read flag values. |
| `AbbyFlag` component | `AbbyFlag` component (optional) | Render‑prop style component for JSX‑free usage. |
| `useAbbyClient()` | `useAbbyClient()` | Direct access to underlying client (e.g. for custom events). |
| `withAbby()` HOC | **Not needed** – composable covers same use‑case. |
| `AbbyContext` | `app.config.globalProperties.$abby` | Global property for legacy usage. |

### Exported symbols

```ts
export { default as AbbyPlugin } from './vue3/plugin' // also exported from ./vue2/plugin
export { default as AbbyFlag } from './components/AbbyFlag.vue' // optional UI component
export { createAbby, type AbbyClient, type AbbyConfig } from './core/AbbyClient'
export { useAbby } from './vue3/composables/useAbby' // Vue 3 only
export { useAbby as useAbbyVue2 } from './vue2/mixin'   // Vue 2 mixin version
export type { FlagValue, FlagKey } from '@abby/core'
```

---

## 4. Installation & Setup

```bash
# Vue 3
npm i @abby/vue @abby/core
# Vue 2
npm i @abby/vue@^2 @abby/core

# Nuxt (optional)
npm i @abby/nuxt @abby/core
```

### Basic Vue 3 Example

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import { AbbyPlugin, createAbby } from '@abby/vue'

const abby = createAbby({
  apiKey: import.meta.env.VITE_ABBY_API_KEY,
  // optional: enable auto-refresh, poll interval, etc.
})

createApp(App)
  .use(AbbyPlugin, { client: abby })
  .mount('#app')
```

### Vue 2 Example

```js
// main.js
import Vue from 'vue'
import App from './App.vue'
import { AbbyPlugin, createAbby } from '@abby/vue'

const abby = createAbby({
  apiKey: process.env.VUE_APP_ABBY_API_KEY,
})

Vue.use(AbbyPlugin, { client: abby })

new Vue({
  render: h => h(App),
}).$mount('#app')
```

---

## 5. Vue 2 Integration

### 5.1 Plugin (`src/vue2/plugin.ts`)

```ts
import { PluginObject } from 'vue'
import { AbbyClient } from '../core/AbbyClient'

export interface AbbyVue2Options {
  client: AbbyClient
}

const AbbyPlugin: PluginObject<AbbyVue2Options> = {
  install(Vue, options) {
    if (!options?.client) {
      throw new Error('[Abby] client instance is required in Vue 2 plugin')
    }
    // expose as $abby on every component instance
    Vue.prototype.$abby = options.client

    // reactive store for flags (observable)
    const flagStore = Vue.observable({})

    // sync core flag changes to Vue observable
    options.client.onFlagChange((key, value) => {
      Vue.set(flagStore, key, value)
    })

    // expose a helper mixin (optional) to map flags to computed props
    Vue.mixin({
      computed: {
        $abbyFlags() {
          return flagStore
        }
      }
    })
  }
}

export default AbbyPlugin
```

### 5.2 Mixin (for older codebases)

```ts
// src/vue2/mixin.ts
import { AbbyClient } from '../core/AbbyClient'

export const AbbyMixin = {
  data() {
    return {
      abbyFlags: {} as Record<string, any>
    }
  },
  created() {
    const client: AbbyClient = (this as any).$abby
    client.onFlagChange((k, v) => {
      this.$set(this.abbyFlags, k, v)
    })
    // prepopulate with current values
    Object.entries(client.getAllFlags()).forEach(([k, v]) => {
      this.$set(this.abbyFlags, k, v)
    })
  },
  methods: {
    $flag(key: string, fallback?: any) {
      return this.abbyFlags[key] ?? fallback
    }
  }
}
```

**Usage in a component**

```vue
<template>
  <button :disabled="$flag('checkout_disabled')">
    Checkout
  </button>
</template>

<script>
export default {
  mixins: [require('@abby/vue').AbbyMixin]
}
</script>
```

---

## 6. Vue 3 Integration (Composition API)

### 6.1 Plugin (`src/vue3/plugin.ts`)

```ts
import { App, InjectionKey } from 'vue'
import { AbbyClient } from '../core/AbbyClient'

export const ABBY_CLIENT_KEY: InjectionKey<AbbyClient> = Symbol('AbbyClient')

export interface AbbyVue3Options {
  client: AbbyClient
}

export default {
  install(app: App, options: AbbyVue3Options) {
    if (!options?.client) {
      throw new Error('[Abby] client instance is required in Vue 3 plugin')
    }
    // provide client globally
    app.provide(ABBY_CLIENT_KEY, options.client)

    // expose as globalProperties for Options API users
    app.config.globalProperties.$abby = options.client
  }
}
```

### 6.2 Composable (`src/vue3/composables/useAbby.ts`)

```ts
import { inject, ref, computed, watchEffect } from 'vue'
import { ABBY_CLIENT_KEY } from '../plugin'
import type { AbbyClient, FlagKey, FlagValue } from '@abby/core'

export function useAbby() {
  const client = inject(ABBY_CLIENT_KEY) as AbbyClient
  if (!client) {
    throw new Error('[Abby] useAbby must be called after installing AbbyPlugin')
  }

  // Reactive map of flag values
  const flags = ref<Record<FlagKey, FlagValue>>({})

  // Initial population
  flags.value = client.getAllFlags()

  // Listen to flag updates and keep ref in sync
  const unsubscribe = client.onFlagChange((key, value) => {
    flags.value = { ...flags.value, [key]: value }
  })

  // Helper to retrieve a single flag (computed)
  const flag = (key: FlagKey, fallback?: FlagValue) => {
    return computed(() => flags.value[key] ?? fallback)
  }

  // Clean‑up when component unmounts
  // (Vue automatically calls the function returned from watchEffect)
  watchEffect((onInvalidate) => {
    onInvalidate(() => unsubscribe())
  })

  return {
    client,
    flags: flags as Readonly<typeof flags>,
    flag,
  }
}
```

#### Example component (Composition API)

```vue
<template>
  <div>
    <p v-if="isBeta.value">🚀 You are in the beta!</p>
    <button :disabled="checkoutDisabled.value">Checkout</button>
  </div>
</template>

<script setup lang="ts">
import { useAbby } from '@abby/vue'

const { flag } = useAbby()

const isBeta = flag('beta_user', false)
const checkoutDisabled = flag('checkout_disabled', false)
</script>
```

---

## 7. Nuxt Module (v2 & v3)

### 7.1 Overview

| Nuxt version | Entry point | Usage |
|--------------|-------------|-------|
| Nuxt 2 | `@abby/nuxt/module.js` (CJS) | `modules: ['@abby/nuxt']` in `nuxt.config.js` |
| Nuxt 3 | `@abby/nuxt/module.ts` (ESM) | `modules: ['@abby/nuxt']` in `nuxt.config.ts` |

The module does three things:

1. **Injects an Abby client instance** (based on runtime config) into the Nuxt context (`$abby`).  
2. **Prefetches flags on server** (`asyncData`/`fetch` hooks) and makes them available for hydration.  
3. **Provides a composable** (`useAbby`) for Vue 3‑based Nuxt 3 apps.

### 7.2 Nuxt 2 Module (`src/nuxt/module.js`)

```js
const { resolve } = require('path')
const { createAbby } = require('@abby/core')

module.exports = function AbbyNuxtModule(moduleOptions) {
  // Merge module options with runtime config
  const config = Object.assign(
    {},
    this.options.abby || {},
    moduleOptions
  )

  // Create client (singleton)
  const client = createAbby({
    apiKey: config.apiKey,
    env: config.env,
