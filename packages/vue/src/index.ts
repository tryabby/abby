import {
  type ABConfig,
  Abby,
  type AbbyConfig,
  type AbbyDataResponse,
  AbbyEventType,
  HttpService,
  type RemoteConfigValueString,
  type RemoteConfigValueStringToType,
  type ValidatorType,
  getABStorageKey,
  getDefaultRemoteConfigValue,
  getFFStorageKey,
  getRCStorageKey,
} from "@tryabby/core";
import type { Infer } from "@tryabby/core/validation";
import {
  type App,
  type ComputedRef,
  type InjectionKey,
  type PropType,
  computed,
  defineComponent,
  getCurrentInstance,
  getCurrentScope,
  hasInjectionContext,
  inject,
  onMounted,
  onScopeDispose,
  onUnmounted,
  provide,
  shallowRef,
  watch,
} from "vue";
import { createStorage, isBrowser, readCookies } from "./storage";

export { defineConfig, type ABConfig, type AbbyConfig } from "@tryabby/core";

export type ABTestReturnValue<Lookup, Variant> = Lookup extends undefined
  ? Variant
  : Variant extends keyof Lookup
    ? Lookup[Variant]
    : never;

export interface AbbyInstallOptions {
  /** Data already obtained by the host. SSR never fetches on its own. */
  initialData?: AbbyDataResponse;
}

/** The tiny factory interface avoids a runtime dependency on the devtools UI. */
// biome-ignore lint/suspicious/noConfusingVoidType: Existing factories may return void or a cleanup callback.
export type AbbyDevtoolsCleanup = void | (() => void);

export interface AbbyDevtoolsFactory<Core> {
  create(props: { abby: Core; [key: string]: unknown }): AbbyDevtoolsCleanup;
}

export type AbbyDevtoolsOptions = Record<string, unknown> & {
  dangerouslyForceShow?: boolean;
};

/** Clone data containers, retaining supplied fetch functions and validators. */
function copyConfig<T>(value: T): T {
  if (Array.isArray(value)) return value.map(copyConfig) as T;
  if (value && typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype === Object.prototype || prototype === null) {
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, copyConfig(item)])
      ) as T;
    }
  }
  return value;
}

export function createAbby<
  const FlagName extends string,
  const Tests extends Record<string, ABConfig>,
  const RemoteConfig extends Record<RemoteConfigName, RemoteConfigValueString>,
  const RemoteConfigName extends Extract<keyof RemoteConfig, string>,
  const User extends Record<string, ValidatorType> = Record<
    string,
    ValidatorType
  >,
>(
  abbyConfig: AbbyConfig<
    FlagName,
    Tests,
    string[],
    RemoteConfigName,
    RemoteConfig,
    User
  >
) {
  type TestName = Extract<keyof Tests, string>;
  type Core = Abby<
    FlagName,
    TestName,
    Tests,
    RemoteConfig,
    RemoteConfigName,
    string[],
    User
  >;
  type ProjectData = ReturnType<Core["getProjectData"]>;
  type UserProperties = Partial<{
    -readonly [K in keyof User]: Infer<User[K]>;
  }>;

  // The factory owns only immutable configuration and an injection key. A core is
  // allocated for each app installation / Provider, never for the factory itself.
  const template = copyConfig(abbyConfig);
  const apps = new WeakMap<App, Runtime>();
  const key: InjectionKey<Runtime> = Symbol("Abby Vue runtime");

  function createRuntime(initialData?: AbbyDataResponse) {
    const config = copyConfig(template);
    const active = shallowRef(false);
    const ready = shallowRef(false);
    let assignmentReady = false;
    let disposed = false;
    let started = false;
    let loading: Promise<void> | undefined;
    const releases = new Set<() => void>();
    const snapshotListeners = new Set<(value: ProjectData) => void>();
    const storage = createStorage(
      config.projectId,
      () => config.cookies,
      () => active.value && assignmentReady && !disposed
    );
    const core: Core = new Abby(
      config,
      {
        ...storage.tests,
        get(name: string) {
          const value = storage.tests.get(name);
          return value !== null &&
            config.tests?.[name]?.variants.includes(value)
            ? value
            : null;
        },
      },
      storage.flags,
      storage.remoteConfig
    );
    const originalInit = core.init.bind(core);
    core.init = (value) => {
      const response = copyConfig(value);
      response.remoteConfig = Array.isArray(response.remoteConfig)
        ? response.remoteConfig
        : [];
      // Core can dereference an absent remoteConfig entry after init. Supply
      // configured defaults for omitted keys, including the built-in type default.
      for (const name of Object.keys(
        config.remoteConfig ?? {}
      ) as RemoteConfigName[]) {
        if (response.remoteConfig.some((item) => item.name === name)) continue;
        const kind = config.remoteConfig?.[name];
        if (kind === undefined) continue;
        const value =
          config.settings?.remoteConfig?.fallbackValues?.[name] ??
          config.settings?.remoteConfig?.defaultValues?.[kind] ??
          getDefaultRemoteConfigValue(kind);
        response.remoteConfig.push({ name, value: copyConfig(value) });
      }
      return originalInit(response);
    };

    // Core's legacy parser uses substring matching. Admit only exact keys from
    // this project/config, valid variants and valid scalar/JSON overrides.
    const originalReadOverrides = core.setLocalOverrides.bind(core);
    core.setLocalOverrides = () => {
      if (
        !active.value ||
        !assignmentReady ||
        !isBrowser() ||
        config.cookies?.disableByDefault
      )
        return;
      const cookies = readCookies();
      const safe: string[] = [];
      const add = (cookieKey: string, validate: (value: string) => boolean) => {
        const value = cookies.get(cookieKey);
        if (value === undefined) return;
        try {
          if (validate(value))
            safe.push(
              `${encodeURIComponent(cookieKey)}=${encodeURIComponent(value)}`
            );
        } catch {
          // Invalid stored JSON or an obsolete variant is not application data.
        }
      };
      for (const name of Object.keys(config.tests ?? {})) {
        add(
          getABStorageKey(config.projectId, name),
          (value) => config.tests?.[name].variants.includes(value) ?? false
        );
      }
      for (const name of config.flags ?? []) {
        add(
          getFFStorageKey(config.projectId, name),
          (value) => value === "true" || value === "false"
        );
      }
      for (const name of Object.keys(config.remoteConfig ?? {})) {
        add(getRCStorageKey(config.projectId, name), (value) => {
          const kind = config.remoteConfig?.[name as RemoteConfigName];
          if (kind === "Number")
            return /^-?\d+$/.test(value) && Number.isFinite(Number(value));
          if (kind === "JSON") {
            const parsed: unknown = JSON.parse(value);
            return (
              parsed !== null &&
              typeof parsed === "object" &&
              !Array.isArray(parsed)
            );
          }
          return kind === "String";
        });
      }
      originalReadOverrides(safe.join("; "));
    };

    const snapshot = () => copyConfig(core.getProjectData());
    const data = shallowRef<ProjectData>(snapshot());
    const refreshSnapshot = (notifyScopes = true) => {
      if (disposed) return;
      data.value = snapshot();
      if (notifyScopes) {
        for (const listener of snapshotListeners)
          listener(copyConfig(data.value));
      }
    };
    const coreRelease = core.subscribe(() => refreshSnapshot(false));
    releases.add(coreRelease);
    let hasInitialData = initialData !== undefined;
    const init = (value: AbbyDataResponse) => {
      if (disposed) return;
      // Both Core's response transformation and subsequent notifications mutate.
      core.init(value);
      refreshSnapshot();
    };
    if (initialData) init(initialData);

    const finishInitialLoad = () => {
      if (disposed || !active.value) return;
      // Storage can now assign from the actual loaded weights (or the settled
      // fallback). Publish that snapshot before revealing a variant to consumers.
      assignmentReady = true;
      core.setLocalOverrides("");
      refreshSnapshot();
      ready.value = true;
    };

    const loadProjectData = async () => {
      if (disposed || !active.value || !isBrowser()) return;
      if (loading) return loading;
      loading = (async () => {
        try {
          await core.loadProjectData();
        } catch {
          // Preserve the current/default snapshot on bad data or failed fetch.
        } finally {
          if (!ready.value) finishInitialLoad();
          else refreshSnapshot();
          loading = undefined;
        }
      })();
      return loading;
    };
    const mount = () => {
      if (started || disposed || !isBrowser()) return;
      started = true;
      const consent = readCookies().get(
        getABStorageKey(config.projectId, "$_abcc_$")
      );
      if (consent === "true" || consent === "false") {
        config.cookies ??= {};
        config.cookies.disableByDefault = consent !== "true";
      }
      active.value = true;
      if (hasInitialData) finishInitialLoad();
      else void loadProjectData();
    };
    const dispose = () => {
      if (disposed) return;
      disposed = true;
      assignmentReady = false;
      ready.value = false;
      active.value = false;
      for (const release of releases) release();
      releases.clear();
      snapshotListeners.clear();
    };
    const names = () => ({
      tests: Object.keys(config.tests ?? {}),
      flags: [...(config.flags ?? [])],
      remoteConfig: Object.keys(config.remoteConfig ?? {}),
    });
    return {
      core,
      config,
      active,
      ready,
      data,
      mount,
      dispose,
      loadProjectData,
      refreshSnapshot,
      subscribe(listener: (value: ProjectData) => void) {
        if (disposed) return () => {};
        snapshotListeners.add(listener);
        const unsubscribe = core.subscribe(() => {
          if (!disposed) listener(snapshot());
        });
        let released = false;
        const release = () => {
          if (released) return;
          released = true;
          unsubscribe();
          releases.delete(release);
          snapshotListeners.delete(listener);
        };
        releases.add(release);
        return release;
      },
      setInitialData(value: AbbyDataResponse) {
        hasInitialData = true;
        init(value);
        if (active.value && !ready.value) finishInitialLoad();
      },
      resetTest(name: TestName) {
        storage.resetTest(name);
        refreshSnapshot();
      },
      enableCookies() {
        config.cookies ??= {};
        config.cookies.disableByDefault = false;
        core.enableCookies();
        storage.consent(true);
        refreshSnapshot();
      },
      disableCookies() {
        config.cookies ??= {};
        config.cookies.disableByDefault = true;
        storage.clear(names());
        storage.consent(false);
        refreshSnapshot();
      },
    };
  }

  type Runtime = ReturnType<typeof createRuntime>;

  function runtime(app?: App): Runtime {
    const found = app
      ? apps.get(app)
      : hasInjectionContext()
        ? inject(key, null)
        : null;
    if (!found) {
      throw new Error(
        "Abby: install AbbyPlugin on this app or render inside AbbyProvider; outside setup, pass the installed app explicitly."
      );
    }
    return found;
  }

  function useSnapshot() {
    const current = runtime();
    if (!getCurrentScope()) {
      throw new Error(
        "Abby composables require an active Vue component or effect scope."
      );
    }
    const local = shallowRef<ProjectData>(copyConfig(current.data.value));
    onScopeDispose(
      current.subscribe((value) => {
        local.value = value;
      })
    );
    if (getCurrentInstance()) onMounted(current.mount);
    return { current, local };
  }

  const install = (app: App, options: AbbyInstallOptions = {}) => {
    if (apps.has(app)) return;
    const current = createRuntime(options.initialData);
    apps.set(app, current);
    app.provide(key, current);
    app.onUnmount(() => {
      current.dispose();
      apps.delete(app);
    });
    app.mixin({
      mounted() {
        if (this === this.$root) current.mount();
      },
    });
  };
  const AbbyPlugin = { install };

  const AbbyProvider = defineComponent({
    name: "AbbyProvider",
    props: {
      initialData: {
        type: Object as PropType<AbbyDataResponse>,
        required: false,
      },
    },
    setup(props, { slots }) {
      const current = createRuntime(props.initialData);
      provide(key, current);
      onMounted(current.mount);
      onUnmounted(current.dispose);
      watch(
        () => props.initialData,
        (value) => {
          if (value) current.setInitialData(value);
        }
      );
      return () => slots.default?.();
    },
  });

  function useAbby<
    K extends TestName,
    const Lookup extends
      | Record<Tests[K]["variants"][number], unknown>
      | undefined = undefined,
  >(
    name: K,
    lookup?: Lookup
  ): {
    variant: ComputedRef<
      ABTestReturnValue<Lookup, Tests[K]["variants"][number]> | undefined
    >;
    onAct: () => void;
  } {
    const { current, local } = useSnapshot();
    const component = getCurrentInstance();
    const exposed = shallowRef(component === null && current.active.value);
    if (component) {
      onMounted(() => {
        exposed.value = true;
      });
    } else {
      // Explicit effect scopes can observe an installed app after it mounts.
      watch(current.active, (mounted) => {
        exposed.value = mounted;
      });
    }
    onScopeDispose(() => {
      exposed.value = false;
    });
    const selected = computed(() =>
      current.active.value && current.ready.value && exposed.value
        ? (local.value.tests[name]?.selectedVariant as
            | Tests[K]["variants"][number]
            | undefined)
        : undefined
    );
    const variant = computed(() => {
      const value = selected.value;
      if (value === undefined) return undefined;
      return (
        lookup === undefined ? value : lookup[value]
      ) as ABTestReturnValue<Lookup, Tests[K]["variants"][number]>;
    });
    const send = (type: AbbyEventType) => {
      if (!isBrowser() || !current.active.value || selected.value === undefined)
        return;
      try {
        const pending = HttpService.sendData({
          url: current.config.apiUrl,
          type,
          data: {
            projectId: current.config.projectId,
            testName: name,
            selectedVariant: selected.value,
          },
        });
        if (pending) void pending.catch(() => {});
      } catch {
        // Analytics must not break rendering or a click handler.
      }
    };
    watch(
      selected,
      (value) => {
        if (value !== undefined) send(AbbyEventType.PING);
      },
      { immediate: true, flush: "post" }
    );
    return { variant, onAct: () => send(AbbyEventType.ACT) };
  }

  const useFeatureFlag = (name: FlagName): ComputedRef<boolean> => {
    const { current, local } = useSnapshot();
    return computed(
      () => local.value.flags[name]?.value ?? current.core.getFeatureFlag(name)
    );
  };
  const useFeatureFlags = () => {
    const { local } = useSnapshot();
    return computed(() =>
      Object.entries(local.value.flags).map(([name, item]) => ({
        name: name as FlagName,
        value: (item as { value: boolean }).value,
      }))
    );
  };
  const useRemoteConfig = <K extends RemoteConfigName>(
    name: K
  ): ComputedRef<RemoteConfigValueStringToType<RemoteConfig[K]>> => {
    const { current, local } = useSnapshot();
    return computed(
      () =>
        (local.value.remoteConfig[name]?.value ??
          current.core.getRemoteConfig(name)) as RemoteConfigValueStringToType<
          RemoteConfig[K]
        >
    );
  };
  const useRemoteConfigVariables = () => {
    const { local } = useSnapshot();
    return computed(() =>
      Object.entries(local.value.remoteConfig).map(([name, item]) => ({
        name: name as RemoteConfigName,
        value: (item as { value: unknown })
          .value as RemoteConfigValueStringToType<
          RemoteConfig[RemoteConfigName]
        >,
      }))
    );
  };

  const useAbbyClient = (app?: App): Core => runtime(app).core;
  const getFeatureFlagValue = (name: FlagName, app?: App) =>
    runtime(app).core.getFeatureFlag(name);
  const getRemoteConfig = <K extends RemoteConfigName>(
    name: K,
    app?: App
  ): RemoteConfigValueStringToType<RemoteConfig[K]> =>
    runtime(app).core.getRemoteConfig(name);
  const getABTestValue = <
    K extends TestName,
    const Lookup extends
      | Record<Tests[K]["variants"][number], unknown>
      | undefined = undefined,
  >(
    name: K,
    lookup?: Lookup,
    app?: App
  ): ABTestReturnValue<Lookup, Tests[K]["variants"][number]> | undefined => {
    const current = runtime(app);
    if (!current.active.value || !current.ready.value || !isBrowser())
      return undefined;
    const value = current.core.getTestVariant(name);
    return (lookup === undefined ? value : lookup[value]) as ABTestReturnValue<
      Lookup,
      Tests[K]["variants"][number]
    >;
  };
  const getVariants = <K extends TestName>(name: K, app?: App) =>
    runtime(app).core.getVariants(name);
  const getABResetFunction = (name: TestName, app?: App) => {
    const current = runtime(app);
    return () => current.resetTest(name);
  };
  const updateUserProperties = (user: UserProperties, app?: App) =>
    runtime(app).core.updateUserProperties(user);
  const enableCookies = (app?: App) => runtime(app).enableCookies();
  const disableCookies = (app?: App) => runtime(app).disableCookies();
  const loadProjectData = (app?: App) => runtime(app).loadProjectData();

  const withDevtools = (
    factory: AbbyDevtoolsFactory<Core>,
    props: AbbyDevtoolsOptions = {}
  ) =>
    defineComponent({
      name: "AbbyDevtools",
      setup() {
        const current = runtime();
        let destroy: AbbyDevtoolsCleanup;
        onMounted(() => {
          if (
            !props.dangerouslyForceShow &&
            process.env.NODE_ENV !== "development"
          )
            return;
          destroy = factory.create({ ...props, abby: current.core });
        });
        onUnmounted(() => {
          if (typeof destroy === "function") destroy();
        });
        return () => null;
      },
    });

  return {
    install,
    AbbyPlugin,
    AbbyProvider,
    useAbby,
    useFeatureFlag,
    useFeatureFlags,
    useRemoteConfig,
    useRemoteConfigVariables,
    useAbbyClient,
    getFeatureFlagValue,
    getRemoteConfig,
    getABTestValue,
    getVariants,
    getABResetFunction,
    updateUserProperties,
    enableCookies,
    disableCookies,
    loadProjectData,
    withDevtools,
    get __abby__(): Core {
      return runtime().core;
    },
  };
}
