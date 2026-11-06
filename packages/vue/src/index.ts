/**
 * Vue 3 Composable & Plugin Integration for Abby (`@tryabby/vue`)
 * Bounty: tryabby/abby #68 ($40 USD — Vue Integration @tryabby/vue)
 *
 * Provides `createAbbyPlugin`, `useAbby`, `useFeatureFlag`, and `useAbTest`
 * for Vue 3 applications matching `@tryabby/react`.
 */

export interface AbbyConfig {
  projectId: string;
  currentEnvironment?: string;
  apiKey?: string;
  baseUrl?: string;
  flags?: Record<string, boolean>;
  tests?: Record<string, { variant: string; payload?: unknown }>;
  fetchImpl?: typeof fetch;
}

export interface AbbyStore {
  projectId: string;
  environment: string;
  isReady: boolean;
  getFlag: (flagKey: string, fallback?: boolean) => boolean;
  getVariant: (testKey: string, fallbackVariant?: string) => { variant: string; payload?: unknown };
  trackConversion: (testKey: string, metadata?: Record<string, unknown>) => Promise<void>;
  refresh: () => Promise<void>;
}

export const ABBY_INJECTION_KEY = Symbol.for('@tryabby/vue');

export function createAbbyClient(config: AbbyConfig): AbbyStore {
  const baseUrl = (config.baseUrl || 'https://api.tryabby.com/v1').replace(/\/+$/, '');
  const environment = config.currentEnvironment || 'production';
  const fetchImpl = config.fetchImpl || globalThis.fetch;

  const state = {
    isReady: Boolean(config.flags || config.tests),
    flags: { ...(config.flags || {}) } as Record<string, boolean>,
    tests: { ...(config.tests || {}) } as Record<string, { variant: string; payload?: unknown }>,
  };

  async function refresh() {
    const res = await fetchImpl(
      `${baseUrl}/projects/${encodeURIComponent(config.projectId)}/config?env=${encodeURIComponent(environment)}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...(config.apiKey ? { 'x-abby-key': config.apiKey } : {}),
        },
      }
    );
    if (!res.ok) {
      throw new Error(`Abby config fetch failed (${res.status})`);
    }
    const data = (await res.json()) as {
      flags?: Record<string, boolean>;
      tests?: Record<string, { variant: string; payload?: unknown }>;
    };
    if (data.flags) Object.assign(state.flags, data.flags);
    if (data.tests) Object.assign(state.tests, data.tests);
    state.isReady = true;
  }

  async function trackConversion(testKey: string, metadata: Record<string, unknown> = {}) {
    const active = state.tests[testKey];
    await fetchImpl(`${baseUrl}/projects/${encodeURIComponent(config.projectId)}/conversions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { 'x-abby-key': config.apiKey } : {}),
      },
      body: JSON.stringify({
        environment,
        testKey,
        variant: active?.variant || 'default',
        metadata,
      }),
    });
  }

  return {
    projectId: config.projectId,
    environment,
    get isReady() {
      return state.isReady;
    },
    getFlag(flagKey: string, fallback = false): boolean {
      return flagKey in state.flags ? Boolean(state.flags[flagKey]) : fallback;
    },
    getVariant(testKey: string, fallbackVariant = 'A') {
      return state.tests[testKey] || { variant: fallbackVariant };
    },
    trackConversion,
    refresh,
  };
}

let activeGlobalStore: AbbyStore | null = null;

export function createAbbyPlugin(config: AbbyConfig) {
  const store = createAbbyClient(config);
  activeGlobalStore = store;
  return {
    store,
    install(app: { provide: (key: symbol, val: AbbyStore) => void; config?: { globalProperties?: Record<string, unknown> } }) {
      app.provide(ABBY_INJECTION_KEY, store);
      if (app.config?.globalProperties) {
        app.config.globalProperties.$abby = store;
      }
    },
  };
}

export function useAbby(injectedStore?: AbbyStore): AbbyStore {
  const store = injectedStore || activeGlobalStore;
  if (!store) {
    throw new Error('useAbby() called before createAbbyPlugin() was installed');
  }
  return store;
}

export function useFeatureFlag(flagKey: string, fallback = false, injectedStore?: AbbyStore): boolean {
  return useAbby(injectedStore).getFlag(flagKey, fallback);
}

export function useAbTest(testKey: string, fallbackVariant = 'A', injectedStore?: AbbyStore) {
  const store = useAbby(injectedStore);
  const { variant, payload } = store.getVariant(testKey, fallbackVariant);
  return {
    variant,
    payload,
    onConvert: (metadata?: Record<string, unknown>) => store.trackConversion(testKey, metadata),
  };
}
