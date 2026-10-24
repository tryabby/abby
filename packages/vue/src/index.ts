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
import Cookie from "js-cookie";
import {
  type ComputedRef,
  type InjectionKey,
  type MaybeRefOrGetter,
  computed,
  defineComponent,
  getCurrentInstance,
  inject,
  onMounted,
  onUnmounted,
  provide,
  shallowRef,
  toValue,
  watch,
} from "vue";

export { defineConfig, type ABConfig, type AbbyConfig } from "@tryabby/core";

export type ABTestReturnValue<Lookup, Variant> = Lookup extends undefined
  ? Variant
  : Variant extends keyof Lookup
    ? Lookup[Variant]
    : never;

/** Create one instance per Vue app, and a fresh instance for each SSR request. */
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
  input: AbbyConfig<
    FlagName,
    Tests,
    string[],
    RemoteConfigName,
    RemoteConfig,
    User
  >
) {
  // Core mutates tests and cookie consent. Never mutate a shared config object.
  const config = {
    ...input,
    cookies: { ...input.cookies },
    tests: Object.fromEntries(
      Object.entries(input.tests ?? {}).map(([name, test]) => {
        if (!test.variants.length)
          throw new Error(`Abby test "${name}" needs a variant`);
        return [name, { ...test, variants: [...test.variants] }];
      })
    ) as unknown as Tests,
  };
  type UserProperties = Partial<{
    -readonly [K in keyof User]: Infer<User[K]>;
  }>;
  const revision = shallowRef(0);
  const mounted = shallowRef(false);
  const ready = shallowRef(false);
  const assignments = new Map<string, string>();
  let cookieHeader: string | undefined;
  let selectionReady = false;
  let initialized = false;
  let dataVersion = 0;
  let owner: object | undefined;
  let loading: Promise<void> | undefined;
  const consentKey = getABStorageKey(config.projectId, "$_abcc_$");

  const readCookie = (key: string) => {
    if (cookieHeader === undefined)
      return typeof document === "undefined" ? undefined : Cookie.get(key);
    for (const entry of cookieHeader.split(";")) {
      const separator = entry.indexOf("=");
      if (separator < 0) continue;
      try {
        if (decodeURIComponent(entry.slice(0, separator).trim()) === key)
          return decodeURIComponent(entry.slice(separator + 1));
      } catch {
        /* Ignore malformed cookie encoding. */
      }
    }
    return undefined;
  };
  const writeCookie = (key: string, value: string) => {
    if (!mounted.value || config.cookies.disableByDefault) return;
    Cookie.set(key, value, { expires: config.cookies.expiresInDays ?? 365 });
  };
  const storage = (key: (projectId: string, name: string) => string) => ({
    get: (name: string) => readCookie(key(config.projectId, name)) ?? null,
    set: (name: string, value: string) =>
      writeCookie(key(config.projectId, name), value),
  });
  const abby = new Abby<
    FlagName,
    Extract<keyof Tests, string>,
    Tests,
    RemoteConfig,
    RemoteConfigName,
    string[],
    User
  >(
    config,
    {
      get: (name) => {
        if (config.cookies.disableByDefault) return null;
        const value =
          assignments.get(name) ??
          readCookie(getABStorageKey(config.projectId, name));
        return config.tests[name]?.variants.includes(value ?? "")
          ? (value ?? null)
          : null;
      },
      set: (name, value) => {
        if (name === "$_abcc_$") {
          writeCookie(consentKey, value);
          return;
        }
        if (!selectionReady) return;
        assignments.set(name, value);
        writeCookie(getABStorageKey(config.projectId, name), value);
      },
    },
    storage(getFFStorageKey),
    storage(getRCStorageKey)
  );

  const normalize = (data: AbbyDataResponse): AbbyDataResponse => ({
    tests: data.tests,
    flags: (config.flags ?? []).map(
      (name) =>
        data.flags.find((flag) => flag.name === name) ?? {
          name,
          value:
            config.settings?.flags?.fallbackValues?.[name] ??
            config.settings?.flags?.defaultValue ??
            false,
        }
    ),
    remoteConfig: (
      Object.entries(config.remoteConfig ?? {}) as Array<
        [RemoteConfigName, RemoteConfigValueString]
      >
    ).map(
      ([name, type]) =>
        data.remoteConfig?.find((item) => item.name === name) ?? {
          name,
          value:
            config.settings?.remoteConfig?.fallbackValues?.[
              name as RemoteConfigName
            ] ??
            config.settings?.remoteConfig?.defaultValues?.[type] ??
            getDefaultRemoteConfigValue(type),
        }
    ),
  });
  const initialize = (data: AbbyDataResponse) => {
    dataVersion++;
    abby.init(normalize(data));
    if (cookieHeader !== undefined) abby.setLocalOverrides(cookieHeader);
    initialized = true;
    revision.value++;
  };
  const ensureInitialized = () => {
    if (!initialized) initialize({ tests: [], flags: [], remoteConfig: [] });
  };
  const loadProjectData = () => {
    if (!loading) {
      const version = dataVersion;
      loading = (async () => {
        const data = await HttpService.getProjectData({
          projectId: config.projectId,
          environment: config.currentEnvironment,
          url: config.apiUrl,
          fetch: config.fetch,
          __experimentalCdnUrl: config.__experimentalCdnUrl
            ? `${config.__experimentalCdnUrl}/${config.projectId}/${config.currentEnvironment}`
            : undefined,
        });
        if (version === dataVersion) {
          if (data) initialize(data);
          else ensureInitialized();
        }
      })().finally(() => {
        loading = undefined;
      });
    }
    return loading;
  };

  const key: InjectionKey<typeof revision> = Symbol("Abby");
  const requireProvider = () => {
    if (!getCurrentInstance() || !inject(key, undefined))
      throw new Error(
        "Abby composables must be used in setup() inside this instance's AbbyProvider"
      );
  };
  const AbbyProvider = defineComponent(
    (
      props: {
        initialData?: AbbyDataResponse;
        cookies?: string;
        userProperties?: UserProperties;
      },
      { slots }
    ) => {
      const app = getCurrentInstance()?.appContext;
      if (owner && owner !== app)
        throw new Error(
          "Create a fresh Abby instance for each Vue app or SSR request"
        );
      owner = app;
      cookieHeader = props.cookies;
      const consent = readCookie(consentKey);
      if (consent !== undefined)
        config.cookies.disableByDefault = consent !== "true";
      if (props.userProperties) abby.updateUserProperties(props.userProperties);
      if (props.initialData) initialize(props.initialData);
      else ensureInitialized();
      provide(key, revision);
      let unsubscribe: (() => void) | undefined;
      let alive = true;
      onMounted(async () => {
        mounted.value = true;
        unsubscribe = abby.subscribe(() => {
          revision.value++;
        });
        if (!props.initialData) await loadProjectData();
        if (!alive) return;
        selectionReady = true;
        ready.value = true;
        revision.value++;
      });
      watch(
        () => props.initialData,
        (data) => {
          if (data) initialize(data);
        }
      );
      watch(
        () => props.userProperties,
        (user) => {
          if (user) abby.updateUserProperties(user);
        },
        { deep: true }
      );
      onUnmounted(() => {
        alive = false;
        unsubscribe?.();
        mounted.value = false;
        ready.value = false;
        owner = undefined;
      });
      return () => slots.default?.();
    },
    {
      name: "AbbyProvider",
      props: ["initialData", "cookies", "userProperties"],
    }
  );

  const assertName = (name: string, names: readonly string[], kind: string) => {
    if (!names.includes(name)) throw new Error(`Unknown Abby ${kind}: ${name}`);
  };
  const getFeatureFlagValue = (name: FlagName): boolean => {
    assertName(name, config.flags ?? [], "feature flag");
    ensureInitialized();
    return abby.getFeatureFlag(name);
  };
  const getRemoteConfig = <K extends RemoteConfigName>(
    name: K
  ): RemoteConfigValueStringToType<RemoteConfig[K]> => {
    assertName(name, Object.keys(config.remoteConfig ?? {}), "remote config");
    ensureInitialized();
    return abby.getRemoteConfig(name);
  };
  const getVariants = <K extends keyof Tests>(
    name: K
  ): Tests[K]["variants"] => {
    assertName(String(name), Object.keys(config.tests), "test");
    return abby.getVariants(name);
  };
  const getABTestValue = <
    K extends keyof Tests,
    const Lookup extends
      | Record<Tests[K]["variants"][number], unknown>
      | undefined = undefined,
  >(
    name: K,
    lookup?: Lookup
  ): ABTestReturnValue<Lookup, Tests[K]["variants"][number]> => {
    getVariants(name);
    ensureInitialized();
    selectionReady = true;
    const variant = abby.getTestVariant(name);
    return (lookup ? lookup[variant] : variant) as ABTestReturnValue<
      Lookup,
      Tests[K]["variants"][number]
    >;
  };
  const useFeatureFlag = (
    name: MaybeRefOrGetter<FlagName>
  ): ComputedRef<boolean> => {
    requireProvider();
    return computed(() => {
      revision.value;
      return getFeatureFlagValue(toValue(name));
    });
  };
  const useRemoteConfig = <K extends RemoteConfigName>(
    name: MaybeRefOrGetter<K>
  ): ComputedRef<RemoteConfigValueStringToType<RemoteConfig[K]>> => {
    requireProvider();
    return computed(() => {
      revision.value;
      return getRemoteConfig(toValue(name));
    });
  };
  const useFeatureFlags = () => {
    requireProvider();
    return computed(() => {
      revision.value;
      return (config.flags ?? []).map((name) => ({
        name,
        value: getFeatureFlagValue(name),
      }));
    });
  };
  const useRemoteConfigVariables = () => {
    requireProvider();
    return computed(() => {
      revision.value;
      return (Object.keys(config.remoteConfig ?? {}) as RemoteConfigName[]).map(
        (name) => ({ name, value: getRemoteConfig(name) })
      );
    });
  };
  const useAbby = <
    K extends keyof Tests,
    const Lookup extends
      | Record<Tests[K]["variants"][number], unknown>
      | undefined = undefined,
  >(
    name: MaybeRefOrGetter<K>,
    lookup?: Lookup
  ): {
    variant: ComputedRef<
      ABTestReturnValue<Lookup, Tests[K]["variants"][number]> | undefined
    >;
    onAct: () => void;
  } => {
    requireProvider();
    const selected = computed(() => {
      revision.value;
      getVariants(toValue(name));
      return mounted.value && ready.value
        ? getABTestValue(toValue(name))
        : undefined;
    });
    const send = (type: AbbyEventType) => {
      if (!mounted.value || !selected.value) return;
      HttpService.sendData({
        url: config.apiUrl,
        type,
        data: {
          projectId: config.projectId,
          testName: String(toValue(name)),
          selectedVariant: selected.value,
        },
      });
    };
    watch([() => toValue(name), selected], () => send(AbbyEventType.PING), {
      flush: "post",
    });
    return {
      variant: computed(() =>
        selected.value === undefined
          ? undefined
          : ((lookup
              ? lookup[selected.value]
              : selected.value) as ABTestReturnValue<
              Lookup,
              Tests[K]["variants"][number]
            >)
      ),
      onAct: () => send(AbbyEventType.ACT),
    };
  };
  const getABResetFunction = <K extends keyof Tests>(name: K) => {
    getVariants(name);
    return () => {
      assignments.delete(String(name));
      if (typeof document !== "undefined")
        Cookie.remove(getABStorageKey(config.projectId, String(name)));
      // Like React, reset takes effect on the next page load.
    };
  };
  const updateUserProperties = (user: UserProperties) =>
    abby.updateUserProperties(user);
  const enableCookies = () => {
    abby.enableCookies();
    revision.value++;
  };
  const disableCookies = () => {
    abby.disableCookies();
    assignments.clear();
    if (typeof document !== "undefined") {
      Cookie.set(consentKey, "false", {
        expires: config.cookies.expiresInDays ?? 365,
      });
      for (const name of Object.keys(config.tests))
        Cookie.remove(getABStorageKey(config.projectId, name));
    }
    revision.value++;
  };
  const withDevtools = <Props extends { abby: typeof abby }>(
    factory: { create(props: Props): () => void },
    props: Omit<Props, "abby"> & { dangerouslyForceShow?: boolean }
  ) =>
    defineComponent({
      name: "AbbyDevtools",
      setup() {
        let destroy: (() => void) | undefined;
        onMounted(() => {
          if (
            !props.dangerouslyForceShow &&
            process.env.NODE_ENV !== "development"
          )
            return;
          const { dangerouslyForceShow: _force, ...options } = props;
          destroy = factory.create({ ...options, abby } as Props);
        });
        onUnmounted(() => destroy?.());
        return () => null;
      },
    });
  return {
    AbbyProvider,
    useAbby,
    useFeatureFlag,
    useRemoteConfig,
    useFeatureFlags,
    useRemoteConfigVariables,
    getFeatureFlagValue,
    getRemoteConfig,
    getABTestValue,
    getVariants,
    getABResetFunction,
    updateUserProperties,
    withDevtools,
    enableCookies,
    disableCookies,
    loadProjectData,
    __abby__: abby,
  };
}
