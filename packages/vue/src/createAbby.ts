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
  type ShallowRef,
  computed,
  defineComponent,
  hasInjectionContext,
  inject,
  onMounted,
  onUnmounted,
  shallowRef,
  watch,
} from "vue";
import {
  FlagStorageService,
  RemoteConfigStorageService,
  TestStorageService,
} from "./StorageService";

export type ABTestReturnValue<Lookup, TestVariant> = Lookup extends undefined
  ? TestVariant
  : TestVariant extends keyof Lookup
    ? Lookup[TestVariant]
    : never;

export type AbbyPluginOptions = {
  /**
   * Project data that was loaded beforehand, e.g. on the server with `loadInitialData()`.
   * If it's not passed, the data is loaded in the browser once the plugin is installed.
   */
  initialData?: AbbyDataResponse;
};

export type withDevtoolsFunction = (
  factory: DevtoolsFactory,
  props?: Omit<AbbyDevtoolProps, "abby"> & {
    dangerouslyForceShow?: boolean;
  }
) => Component;

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
  // we need to keep the config as a const so that the types are narrowed
  const config = abbyConfig;

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
        return TestStorageService.get(config.projectId, key);
      },
      set: (key: string, value: any) => {
        if (typeof window === "undefined" || config.cookies?.disableByDefault)
          return;
        TestStorageService.set(config.projectId, key, value);
      },
    },
    {
      get: (key: string) => {
        if (typeof window === "undefined") return null;
        return FlagStorageService.get(config.projectId, key);
      },
      set: (key: string, value: any) => {
        if (typeof window === "undefined") return;
        FlagStorageService.set(config.projectId, key, value);
      },
    },
    {
      get: (key: string) => {
        if (typeof window === "undefined") return null;
        return RemoteConfigStorageService.get(config.projectId, key);
      },
      set: (key: string, value: any) => {
        if (typeof window === "undefined") return;
        RemoteConfigStorageService.set(config.projectId, key, value);
      },
    }
  );

  type AbbyProjectData = ReturnType<typeof abby.getProjectData>;

  const AbbyDataKey: InjectionKey<ShallowRef<AbbyProjectData>> = Symbol("abby");

  /**
   * `getProjectData()` selects and stores a variant for every test. Before the
   * weights are loaded from the API that would use equal weights and keep that
   * variant forever, so the tests are left out until the data is loaded.
   */
  const getDataWithoutTests = (): AbbyProjectData => ({
    tests: {} as AbbyProjectData["tests"],
    flags: Object.fromEntries(
      abby.getFeatureFlags().map(({ name, value }) => [name, { value }])
    ) as AbbyProjectData["flags"],
    remoteConfig: Object.fromEntries(
      abby
        .getRemoteConfigVariables()
        // the generic value type can't be narrowed here
        .map(({ name, value }) => [name, { value: value as unknown }])
    ) as AbbyProjectData["remoteConfig"],
  });

  /**
   * Vue plugin that makes the Abby data available to the composables.
   * The state lives on the app (not in this module) so every app, and every
   * request when rendering on the server, gets its own copy.
   */
  const AbbyPlugin = {
    install(app: App, options: AbbyPluginOptions = {}) {
      // The core mutates its data in place and hands out the same nested objects,
      // so the data is kept in a shallowRef and replaced with a fresh snapshot
      // on every change. A deep ref would not notice the core's updates.
      const data = shallowRef<AbbyProjectData>(
        options.initialData
          ? abby.init(options.initialData)
          : getDataWithoutTests()
      );
      app.provide(AbbyDataKey, data);

      // On the server the app is rendered once and never unmounted, so there
      // is nothing to update and a subscription would leak on every request.
      if (typeof window === "undefined") return;

      const unsubscribe = abby.subscribe((newData) => {
        data.value = newData as AbbyProjectData;
      });
      app.onUnmount(unsubscribe);

      if (!options.initialData) {
        // `init()` notifies the subscribers before it applies the local overrides
        // from the cookies, so the resolved data is set once more afterwards.
        // If the data can't be loaded, the tests fall back to the configured variants.
        abby.loadProjectData().then((loadedData) => {
          data.value = loadedData ?? abby.getProjectData();
        });
      }
    },
  };

  const useAbbyData = () => {
    const data = hasInjectionContext() ? inject(AbbyDataKey, null) : null;

    if (!data) {
      throw new Error(
        "Abby composables must be used inside the setup of a component in an app that uses the AbbyPlugin. Call app.use(AbbyPlugin) to fix this error."
      );
    }

    return data;
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

    // The server can't know which variant a user gets (it's stored in a cookie),
    // so like the React integration the variant stays empty until the component
    // is mounted. This avoids hydration mismatches.
    const isMounted = shallowRef(false);
    onMounted(() => {
      isMounted.value = true;
    });

    const selectedVariant = computed(() =>
      isMounted.value
        ? (data.value.tests[name as unknown as TestName]?.selectedVariant ?? "")
        : ""
    );

    // tell the server which variant was rendered, again whenever it changes
    watch(selectedVariant, (variant) => {
      if (!variant) return;

      HttpService.sendData({
        url: config.apiUrl,
        type: AbbyEventType.PING,
        data: {
          projectId: config.projectId,
          selectedVariant: variant,
          testName: name as string,
        },
      });
    });

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

    const variant = computed(() =>
      lookupObject
        ? lookupObject[selectedVariant.value as TestVariant]
        : selectedVariant.value
    ) as ComputedRef<ABTestReturnValue<Lookup, TestVariant>>;

    return {
      variant,
      /**
       * This function can be called to indicate that something that
       * uses the selected variant has been interacted with.
       * It will automatically send the selected variant to the server.
       */
      onAct,
    };
  };

  const useFeatureFlag = (name: FlagName): ComputedRef<boolean> => {
    const data = useAbbyData();
    return computed(() => data.value.flags[name].value);
  };

  /**
   * Returns an Array of all flags with their name and value
   */
  const useFeatureFlags = () => {
    const data = useAbbyData();
    return computed(() =>
      (Object.keys(data.value.flags) as Array<FlagName>).map((flagName) => ({
        name: flagName,
        value: data.value.flags[flagName].value,
      }))
    );
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
          .value as RemoteConfigValueStringToType<Config>
    );
  };

  /**
   * Returns an Array of all remote config variables with their name and value
   */
  const useRemoteConfigVariables = () => {
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

  /**
   * Loads the project data from the Abby API, e.g. on the server to pass it
   * as `initialData` to the plugin so the first render already has the right values
   */
  const loadInitialData = () =>
    HttpService.getProjectData({
      projectId: config.projectId,
      environment: config.currentEnvironment as string,
      url: config.apiUrl,
      fetch: config.fetch,
      __experimentalCdnUrl: config.__experimentalCdnUrl
        ? `${config.__experimentalCdnUrl}/${config.projectId}/${config.currentEnvironment}`
        : undefined,
    });

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

  /**
   * Creates a component that renders the Abby devtools.
   * They are only shown in development unless `dangerouslyForceShow` is set.
   */
  const withDevtools: withDevtoolsFunction = (factory, props) =>
    defineComponent({
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

  return {
    AbbyPlugin,
    useAbby,
    useFeatureFlag,
    useFeatureFlags,
    useRemoteConfig,
    useRemoteConfigVariables,
    loadInitialData,
    getFeatureFlagValue,
    getRemoteConfig,
    getABTestValue,
    getABResetFunction,
    getVariants,
    updateUserProperties,
    withDevtools,
    __abby__: abby,
  };
}
