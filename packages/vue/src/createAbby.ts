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
import {
  type App,
  type Component,
  type ComputedRef,
  type InjectionKey,
  type Plugin,
  type PropType,
  type ShallowRef,
  computed,
  defineComponent,
  getCurrentInstance,
  inject,
  onMounted,
  onUnmounted,
  provide,
  shallowRef,
  watch,
} from "vue";
import {
  FlagStorageService,
  RemoteConfigStorageService,
  TestStorageService,
} from "./StorageService";

/**
 * Structural mirror of the public `@tryabby/devtools` API. The devtools are a
 * svelte package, so we type them structurally here instead of pulling in a
 * svelte dependency for types only.
 */
export type AbbyDevtoolProps = {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  defaultShow?: boolean;
  shortcut?: string | Array<string>;
};

export type withDevtoolsFunction = (
  factory: {
    create: (props: AbbyDevtoolProps & { abby: unknown }) => () => void;
  },
  props?: Omit<AbbyDevtoolProps, "abby"> & {
    dangerouslyForceShow?: boolean;
  }
) => Component;

export type ABTestReturnValue<Lookup, TestVariant> = Lookup extends undefined
  ? TestVariant
  : TestVariant extends keyof Lookup
    ? Lookup[TestVariant]
    : never;

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
  const abby = new Abby<
    FlagName,
    TestName,
    Tests,
    RemoteConfig,
    RemoteConfigName,
    string[],
    User
  >(
    abbyConfig,
    {
      get: (key: string) => {
        if (typeof window === "undefined") return null;
        return TestStorageService.get(abbyConfig.projectId, key);
      },
      set: (key: string, value: any) => {
        if (
          typeof window === "undefined" ||
          abbyConfig.cookies?.disableByDefault
        )
          return;
        TestStorageService.set(abbyConfig.projectId, key, value);
      },
    },
    {
      get: (key: string) => {
        if (typeof window === "undefined") return null;
        return FlagStorageService.get(abbyConfig.projectId, key);
      },
      set: (key: string, value: any) => {
        if (typeof window === "undefined") return;
        FlagStorageService.set(abbyConfig.projectId, key, value);
      },
    },
    {
      get: (key: string) => {
        if (typeof window === "undefined") return null;
        return RemoteConfigStorageService.get(abbyConfig.projectId, key);
      },
      set: (key: string, value: any) => {
        if (typeof window === "undefined") return;
        RemoteConfigStorageService.set(abbyConfig.projectId, key, value);
      },
    }
  );

  // we need to return the config as a const so that the types are narrowed
  const config = abbyConfig;

  type AbbyProjectData = ReturnType<typeof abby.getProjectData>;

  // Reactive singleton of the project data. Every createAbby instance owns its
  // own ref, so multiple apps/projects never leak into each other.
  // The data is kept empty until the provider/plugin initialized it so that
  // (like in react) no variant is selected on the server before hydration.
  const abbyState = shallowRef<AbbyProjectData>({
    tests: {},
    flags: {},
    remoteConfig: {},
  } as AbbyProjectData);

  abby.subscribe((data) => {
    abbyState.value = data as AbbyProjectData;
  });

  let inited = false;

  const initData = (initialData?: AbbyDataResponse) => {
    // initialData is applied on every call so that SSR renders (e.g. Nuxt
    // server handlers) always hydrate from the request scoped payload
    if (initialData) {
      inited = true;
      abbyState.value = abby.init(initialData);
      return;
    }
    if (inited || typeof window === "undefined") return;
    inited = true;

    abby.loadProjectData().then((data) => {
      if (!data) return;
      abbyState.value = data;
    });
  };

  // unique per createAbby instance -> provide/inject isolation between apps
  const AbbyKey: InjectionKey<ShallowRef<AbbyProjectData>> = Symbol(
    `abby:${config.projectId}`
  );

  // use the injected state when a provider/plugin is in the component tree,
  // otherwise fall back to the global singleton of this createAbby instance
  const resolveState = (): ShallowRef<AbbyProjectData> => {
    const instance = getCurrentInstance();
    const injected = instance ? inject(AbbyKey, undefined) : undefined;
    if (injected) return injected;
    // the global singleton has no provider that could initialize it
    initData();
    return abbyState;
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
    const state = resolveState();

    const selectedVariant = computed(
      () =>
        (state.value.tests[name as unknown as TestName]?.selectedVariant ??
          "") as TestVariant
    );

    const variant = computed(
      () =>
        (lookupObject
          ? (lookupObject as Record<TestVariant, LookupValue>)[
              selectedVariant.value
            ]
          : selectedVariant.value) as ABTestReturnValue<Lookup, TestVariant>
    );

    const sendEvent = (type: AbbyEventType) => {
      if (!name || !selectedVariant.value) return;

      HttpService.sendData({
        url: config.apiUrl,
        type,
        data: {
          projectId: config.projectId,
          selectedVariant: selectedVariant.value as string,
          testName: name as string,
        },
      });
    };

    const onAct = () => sendEvent(AbbyEventType.ACT);

    // ping whenever the variant resolves or changes. Inside a component this
    // watch is disposed with the component, outside we rely on the singleton
    // shortcut: watch outside of components is never disposed, upgrade to an explicit effectScope when someone needs it
    watch(selectedVariant, () => sendEvent(AbbyEventType.PING));

    if (getCurrentInstance()) {
      // effects run client side only -> no pings from the server during SSR.
      // Outside of components resolveState() already triggered the data load
      onMounted(() => sendEvent(AbbyEventType.PING));
    }

    return {
      /**
       * This function can be called to indicate that something that
       * uses the selected variant has been rendered.
       * It will automatically send the selected variant to the server.
       */
      onAct,
      variant,
    };
  };

  const useFeatureFlag = (name: FlagName): ComputedRef<boolean> => {
    const state = resolveState();
    return computed(() => {
      // touch the state so that flag overrides and fetches retrigger this
      void state.value;
      return abby.getFeatureFlag(name);
    });
  };

  /**
   * Returns an Array of all flags with their name and value
   */
  const useFeatureFlags = (): ComputedRef<
    Array<{ name: FlagName; value: boolean }>
  > => {
    const state = resolveState();
    return computed(() =>
      (Object.keys(state.value.flags) as Array<FlagName>).map((flagName) => ({
        name: flagName,
        value: state.value.flags[flagName].value,
      }))
    );
  };

  /**
   * Returns an Array of all remote config variables with their name and value
   */
  const useRemoteConfigVariables = (): ComputedRef<
    Array<{
      name: RemoteConfigName;
      value: RemoteConfigValueStringToType<RemoteConfig[RemoteConfigName]>;
    }>
  > => {
    const state = resolveState();
    return computed(() =>
      (Object.keys(state.value.remoteConfig) as Array<RemoteConfigName>).map(
        (configName) => ({
          name: configName,
          value: state.value.remoteConfig[configName]
            .value as RemoteConfigValueStringToType<
            RemoteConfig[RemoteConfigName]
          >,
        })
      )
    );
  };

  const useRemoteConfig = <
    T extends RemoteConfigName,
    Config extends RemoteConfig[T],
  >(
    remoteConfigName: T
  ): ComputedRef<RemoteConfigValueStringToType<Config>> => {
    const state = resolveState();
    return computed(() => {
      // touch the state so that config overrides and fetches retrigger this
      void state.value;
      return abby.getRemoteConfig(
        remoteConfigName
      ) as RemoteConfigValueStringToType<Config>;
    });
  };

  const AbbyProvider = defineComponent({
    name: "AbbyProvider",
    props: {
      initialData: {
        type: Object as PropType<AbbyDataResponse>,
        required: false,
        default: undefined,
      },
    },
    setup(props, { slots }) {
      provide(AbbyKey, abbyState);
      initData(props.initialData);

      return () => slots.default?.() ?? null;
    },
  });

  const AbbyVuePlugin: Plugin = {
    install(app: App, options?: { initialData?: AbbyDataResponse }) {
      app.provide(AbbyKey, abbyState);
      initData(options?.initialData);
    },
  };

  const getFeatureFlagValue = (name: FlagName) => {
    return abby.getFeatureFlag(name);
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
    // Typescript looses its typing here, so we cast as any in favor of having
    // better type inference for the user
    if (lookupObject === undefined) {
      return variant as any;
    }

    return lookupObject[variant as TestVariant] as any;
  };

  const withDevtools: withDevtoolsFunction = (factory, props) => {
    // hacky way to make sure SSR works: the devtools are only created in the
    // browser via onMounted
    return defineComponent({
      name: "AbbyDevtools",
      setup() {
        let destroy: (() => void) | undefined;

        onMounted(() => {
          if (
            !props?.dangerouslyForceShow &&
            process.env.NODE_ENV !== "development"
          ) {
            return;
          }

          destroy = factory.create({ ...props, abby });
        });

        onUnmounted(() => {
          destroy?.();
        });

        return () => null;
      },
    });
  };

  /**
   * Simple helper function create a function that resets an AB test
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

  const updateUserProperties = (
    user: Partial<{
      -readonly [K in keyof User]: Infer<User[K]>;
    }>
  ) => {
    abby.updateUserProperties(user);
  };

  /**
   * Server side helper for Nuxt 3 / h3 loaders. It fetches the project data on
   * the server so that it can be passed to the AbbyVuePlugin or AbbyProvider
   * via `initialData` for hydration.
   */
  const withAbby = <Handler extends (event?: any) => any>(
    handler?: Handler
  ) => {
    return async (event?: any) => {
      const data = await handler?.(event);

      const __abby__data = await HttpService.getProjectData({
        url: config.apiUrl,
        projectId: config.projectId,
        environment: config.currentEnvironment,
      });

      return {
        ...data,
        __abby__data,
        __abby_cookie:
          event?.node?.req?.headers?.cookie ??
          event?.request?.headers?.get?.("cookie"),
      };
    };
  };

  return {
    useAbby,
    AbbyProvider,
    AbbyVuePlugin,
    useFeatureFlag,
    getFeatureFlagValue,
    useRemoteConfig,
    getRemoteConfig,
    getABTestValue,
    __abby__: abby,
    withDevtools,
    getABResetFunction,
    getVariants,
    useFeatureFlags,
    useRemoteConfigVariables,
    updateUserProperties,
    withAbby,
  };
}
