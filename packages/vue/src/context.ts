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
} from "@tryabby/core";
import type { Infer } from "@tryabby/core/validation";
import type { AbbyDevtoolProps, DevtoolsFactory } from "@tryabby/devtools";
import {
  type App,
  type Component,
  type ComputedRef,
  type InjectionKey,
  type Plugin,
  type PropType,
  type Ref,
  computed,
  defineComponent,
  getCurrentInstance,
  inject,
  onMounted,
  onUnmounted,
  provide,
  ref,
  watch,
} from "vue";
import {
  FlagStorageService,
  RemoteConfigStorageService,
  TestStorageService,
} from "./StorageService";

export type withDevtoolsFunction = (
  factory: DevtoolsFactory,
  props: Omit<AbbyDevtoolProps, "abby"> & {
    dangerouslyForceShow?: boolean;
  }
) => Component;

export type ABTestReturnValue<Lookup, TestVariant> = Lookup extends undefined
  ? TestVariant
  : TestVariant extends keyof Lookup
    ? Lookup[TestVariant]
    : never;

export type AbbyPluginOptions<User = Record<string, ValidatorType>> = {
  initialData?: AbbyDataResponse;
  cookies?: string;
  user?: User extends Record<string, ValidatorType>
    ? Partial<{
        -readonly [K in keyof User]: Infer<User[K]>;
      }>
    : Record<string, any>;
};

export function createAbby<
  const FlagName extends string,
  const TestName extends string,
  const Tests extends Record<TestName, ABConfig>,
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
  const config = abbyConfig;

  type UserProperties = Partial<{
    -readonly [K in keyof User]: Infer<User[K]>;
  }>;

  const cloneConfig = (
    cfg: AbbyConfig<
      FlagName,
      Tests,
      string[],
      RemoteConfigName,
      RemoteConfig,
      User
    >
  ): AbbyConfig<
    FlagName,
    Tests,
    string[],
    RemoteConfigName,
    RemoteConfig,
    User
  > => ({
    ...cfg,
    cookies: cfg.cookies ? { ...cfg.cookies } : undefined,
    settings: cfg.settings
      ? {
          ...cfg.settings,
          flags: cfg.settings.flags ? { ...cfg.settings.flags } : undefined,
          remoteConfig: cfg.settings.remoteConfig
            ? { ...cfg.settings.remoteConfig }
            : undefined,
        }
      : undefined,
  });

  const createAbbyInstance = (
    instanceConfig: AbbyConfig<
      FlagName,
      Tests,
      string[],
      RemoteConfigName,
      RemoteConfig,
      User
    > = abbyConfig
  ) =>
    new Abby<
      FlagName,
      TestName,
      Tests,
      RemoteConfig,
      RemoteConfigName,
      string[],
      User
    >(
      instanceConfig,
      {
        get: (key: string) => {
          if (typeof window === "undefined") return null;
          return TestStorageService.get(instanceConfig.projectId, key);
        },
        set: (key: string, value: any) => {
          if (
            typeof window === "undefined" ||
            instanceConfig.cookies?.disableByDefault
          )
            return;
          TestStorageService.set(instanceConfig.projectId, key, value);
        },
      },
      {
        get: (key: string) => {
          if (typeof window === "undefined") return null;
          return FlagStorageService.get(instanceConfig.projectId, key);
        },
        set: (key: string, value: any) => {
          if (typeof window === "undefined") return;
          FlagStorageService.set(instanceConfig.projectId, key, value);
        },
      },
      {
        get: (key: string) => {
          if (typeof window === "undefined") return null;
          return RemoteConfigStorageService.get(instanceConfig.projectId, key);
        },
        set: (key: string, value: any) => {
          if (typeof window === "undefined") return;
          RemoteConfigStorageService.set(instanceConfig.projectId, key, value);
        },
      }
    );

  const abby = createAbbyInstance();

  type AbbyProjectData = ReturnType<typeof abby.getProjectData>;

  const AbbyContextKey: InjectionKey<Ref<AbbyProjectData>> =
    Symbol("AbbyContext");

  let fallbackDataRef: Ref<AbbyProjectData> | null = null;
  let fallbackLoaded = false;

  const getFallbackDataRef = (): Ref<AbbyProjectData> => {
    if (!fallbackDataRef) {
      fallbackDataRef = ref(abby.getProjectData()) as Ref<AbbyProjectData>;
      abby.subscribe((newData) => {
        if (fallbackDataRef) {
          fallbackDataRef.value = newData;
        }
      });
    }
    if (!fallbackLoaded && typeof window !== "undefined") {
      fallbackLoaded = true;
      abby.loadProjectData().then((loadedData) => {
        if (loadedData && fallbackDataRef) {
          fallbackDataRef.value = loadedData;
        }
      });
    }
    return fallbackDataRef;
  };

  const useAbbyData = (): Ref<AbbyProjectData> => {
    if (getCurrentInstance()) {
      const injected = inject(AbbyContextKey, null);
      if (injected) {
        return injected;
      }
    }
    return getFallbackDataRef();
  };

  const useAbby = <
    K extends keyof Tests,
    TestVariant extends Tests[K]["variants"][number],
    LookupValue,
    const Lookup extends
      | Record<TestVariant, LookupValue>
      | undefined = undefined,
  >(
    name: K,
    lookupObject?: Lookup
  ): {
    variant: ComputedRef<ABTestReturnValue<Lookup, TestVariant>>;
    onAct: () => void;
  } => {
    const data = useAbbyData();

    // Render an empty string on the server / initial render to avoid SSR hydration mismatches
    const selectedVariant = ref("");

    const syncVariantAndPing = (nextVariant: string | undefined) => {
      const resolved =
        nextVariant ??
        abby.getProjectData().tests[name as unknown as TestName]
          ?.selectedVariant ??
        "";
      if (!resolved) return;

      const changed = selectedVariant.value !== resolved;
      selectedVariant.value = resolved;

      if (changed && name) {
        HttpService.sendData({
          url: config.apiUrl,
          type: AbbyEventType.PING,
          data: {
            projectId: config.projectId,
            selectedVariant: resolved,
            testName: name as string,
          },
        });
      }
    };

    if (getCurrentInstance()) {
      onMounted(() => {
        syncVariantAndPing(
          data.value.tests[name as unknown as TestName]?.selectedVariant
        );
      });

      watch(
        () => data.value.tests[name as unknown as TestName]?.selectedVariant,
        (newVariant) => {
          if (newVariant !== undefined && selectedVariant.value !== "") {
            syncVariantAndPing(newVariant);
          }
        }
      );
    } else if (typeof window !== "undefined") {
      syncVariantAndPing(
        data.value.tests[name as unknown as TestName]?.selectedVariant
      );
    }

    const onAct = () => {
      if (!selectedVariant.value) return;

      HttpService.sendData({
        url: config.apiUrl,
        type: AbbyEventType.ACT,
        data: {
          projectId: config.projectId,
          selectedVariant: selectedVariant.value,
          testName: name as string,
        },
      });
    };

    const variant = computed<ABTestReturnValue<Lookup, TestVariant>>(() => {
      if (lookupObject) {
        return lookupObject[selectedVariant.value as TestVariant] as any;
      }
      return selectedVariant.value as any;
    });

    return {
      onAct,
      variant,
    };
  };

  const useFeatureFlag = (name: FlagName): ComputedRef<boolean> => {
    const data = useAbbyData();
    return computed(() => data.value.flags[name]?.value ?? false);
  };

  /**
   * Returns a ComputedRef Array of all flags with their name and value
   */
  const useFeatureFlags = (): ComputedRef<
    Array<{
      name: FlagName;
      value: boolean;
    }>
  > => {
    const data = useAbbyData();
    return computed(() =>
      (Object.keys(data.value.flags) as Array<FlagName>).map((flagName) => ({
        name: flagName,
        value: data.value.flags[flagName].value,
      }))
    );
  };

  /**
   * Returns a ComputedRef Array of all remote config variables with their name and value
   */
  const useRemoteConfigVariables = (): ComputedRef<
    Array<{
      name: RemoteConfigName;
      value: RemoteConfigValueStringToType<RemoteConfig[RemoteConfigName]>;
    }>
  > => {
    const data = useAbbyData();
    return computed(
      () =>
        (Object.keys(data.value.remoteConfig) as Array<RemoteConfigName>).map(
          (configName) => ({
            name: configName,
            value: data.value.remoteConfig[configName].value,
          })
        ) as Array<{
          name: RemoteConfigName;
          value: RemoteConfigValueStringToType<RemoteConfig[RemoteConfigName]>;
        }>
    );
  };

  const AbbyProvider = defineComponent({
    name: "AbbyProvider",
    props: {
      initialData: {
        type: Object as PropType<AbbyDataResponse>,
        required: false,
      },
      cookies: {
        type: String,
        required: false,
      },
      user: {
        type: Object as PropType<UserProperties>,
        required: false,
      },
    },
    setup(props, { slots }) {
      const targetAbby =
        typeof window === "undefined"
          ? createAbbyInstance(cloneConfig(abbyConfig))
          : abby;

      if (props.cookies) {
        targetAbby.setLocalOverrides(props.cookies);
      }

      if (props.user) {
        targetAbby.updateUserProperties(props.user);
      }

      const initialProjectData = props.initialData
        ? targetAbby.init(props.initialData)
        : targetAbby.getProjectData();

      const data = ref(initialProjectData) as Ref<AbbyProjectData>;
      provide(AbbyContextKey, data);

      let isMounted = false;
      let unsubscribe: (() => void) | undefined;

      onMounted(() => {
        unsubscribe = targetAbby.subscribe((newData) => {
          data.value = newData;
        });

        if (!props.initialData && !isMounted) {
          isMounted = true;
          targetAbby.loadProjectData().then((loadedData) => {
            if (!loadedData) return;
            data.value = loadedData;
          });
        }
      });

      onUnmounted(() => {
        unsubscribe?.();
      });

      return () => slots.default?.();
    },
  });

  const abbyPlugin: Plugin<[AbbyPluginOptions<User>?]> = {
    install(app: App, options?: AbbyPluginOptions<User>) {
      const targetAbby =
        typeof window === "undefined"
          ? createAbbyInstance(cloneConfig(abbyConfig))
          : abby;

      if (options?.cookies) {
        targetAbby.setLocalOverrides(options.cookies);
      }

      if (options?.user) {
        targetAbby.updateUserProperties(options.user as any);
      }

      const initialProjectData = options?.initialData
        ? targetAbby.init(options.initialData)
        : targetAbby.getProjectData();

      const data = ref(initialProjectData) as Ref<AbbyProjectData>;
      app.provide(AbbyContextKey, data);

      if (typeof window !== "undefined") {
        targetAbby.subscribe((newData) => {
          data.value = newData;
        });
      }

      if (!options?.initialData && typeof window !== "undefined") {
        targetAbby.loadProjectData().then((loadedData) => {
          if (!loadedData) return;
          data.value = loadedData;
        });
      }
    },
  };

  const getFeatureFlagValue = (name: FlagName) => {
    return abby.getFeatureFlag(name);
  };

  const useRemoteConfig = <
    T extends RemoteConfigName,
    Config extends RemoteConfig[T],
  >(
    remoteConfigName: T
  ): ComputedRef<RemoteConfigValueStringToType<Config>> => {
    const data = useAbbyData();
    return computed(
      () =>
        data.value.remoteConfig[remoteConfigName]
          ?.value as RemoteConfigValueStringToType<Config>
    );
  };

  const getRemoteConfig = <
    T extends RemoteConfigName,
    Config extends RemoteConfig[T],
  >(
    remoteConfigName: T
  ): RemoteConfigValueStringToType<Config> => {
    return abby.getRemoteConfig(remoteConfigName);
  };

  const getABTestValue = <
    TestName extends keyof Tests,
    TestVariant extends Tests[TestName]["variants"][number],
    LookupValue,
    const Lookup extends
      | Record<TestVariant, LookupValue>
      | undefined = undefined,
  >(
    testName: TestName,
    lookupObject?: Lookup
  ): ABTestReturnValue<Lookup, TestVariant> => {
    const variant = abby.getTestVariant(testName);
    if (lookupObject === undefined) {
      return variant as any;
    }

    return lookupObject[variant as TestVariant] as any;
  };

  const withDevtools: withDevtoolsFunction = (factory, props) => {
    return defineComponent({
      name: "AbbyDevtools",
      setup() {
        let inited = false;
        let destroy: (() => void) | undefined;

        onMounted(() => {
          if (inited) {
            return;
          }

          if (
            !props?.dangerouslyForceShow &&
            process.env.NODE_ENV !== "development"
          ) {
            return;
          }

          inited = true;
          destroy = factory.create({ ...props, abby });
        });

        onUnmounted(() => {
          inited = false;
          destroy?.();
        });

        return () => null;
      },
    });
  };

  /**
   * Simple helper function to create a function that resets an AB test
   * @param name the name of the test
   * @returns A function that can be called to reset the test
   */
  const getABResetFunction = <T extends keyof Tests>(name: T) => {
    return () => {
      TestStorageService.remove(config.projectId, name as string);
    };
  };

  /**
   * Simple helper function to get a list of all variants for a given test
   * @param name the name of the test
   * @returns an array of all variants
   */
  const getVariants = <T extends keyof Tests>(name: T) => {
    return abby.getVariants(name);
  };

  const updateUserProperties = (user: UserProperties) => {
    // Server: pass `user` through AbbyProvider props, plugin options or withAbby options instead.
    if (typeof window === "undefined") return;
    abby.updateUserProperties(user);
  };

  /**
   * Enables A/B test assignment cookies on the client and notifies subscribers
   */
  const enableCookies = () => {
    if (typeof window === "undefined") return;
    abby.enableCookies();
  };

  /**
   * Disables A/B test assignment cookies on the client, removes persisted test cookies, and notifies subscribers
   */
  const disableCookies = () => {
    if (typeof window === "undefined") return;
    abby.disableCookies();
    for (const testName of Object.keys(config.tests ?? {})) {
      TestStorageService.remove(config.projectId, testName);
    }
  };

  /**
   * Loads the latest Abby project data from the server / CDN
   */
  const loadProjectData = () => {
    return abby.loadProjectData();
  };

  /**
   * Nuxt / SSR helper to load Abby project data on the server and apply request cookies
   */
  const withAbby = <T extends Record<string, any> = Record<string, any>>(
    handler?: (event?: any) => Promise<T> | T,
    options?: {
      user?: UserProperties;
    }
  ) => {
    return async (event?: any) => {
      const result = (await handler?.(event)) ?? ({} as T);
      const __abby__data = await HttpService.getProjectData({
        url: config.apiUrl,
        projectId: config.projectId,
        environment: config.currentEnvironment,
        __experimentalCdnUrl: config.__experimentalCdnUrl,
      });

      const cookieHeader =
        event?.node?.req?.headers?.cookie ??
        event?.request?.headers?.get?.("cookie");

      const userProps = options?.user;

      return {
        ...result,
        __abby__data,
        __abby_cookie: cookieHeader,
        __abby_user: userProps,
      };
    };
  };

  return {
    useAbby,
    AbbyProvider,
    abbyPlugin,
    useFeatureFlag,
    getFeatureFlagValue,
    useRemoteConfig,
    getRemoteConfig,
    getABTestValue,
    __abby__: abby,
    withDevtools,
    withAbby,
    getABResetFunction,
    getVariants,
    useFeatureFlags,
    useRemoteConfigVariables,
    updateUserProperties,
    enableCookies,
    disableCookies,
    loadProjectData,
  };
}
