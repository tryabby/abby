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
  type ComputedRef,
  type InjectionKey,
  type PropType,
  type ShallowRef,
  computed,
  defineComponent,
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
  isBrowser,
} from "./StorageService";

/**
 * The value of an AB test. If a lookup object was passed to `useAbby`,
 * the type of the looked up value is returned instead of the variant name.
 */
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
  // we need to return the config as a const so that the types are narrowed
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
    config,
    {
      get: (key: string) => {
        if (!isBrowser()) return null;
        return TestStorageService.get(config.projectId, key);
      },
      set: (key: string, value: string) => {
        if (!isBrowser() || config.cookies?.disableByDefault) return;
        TestStorageService.set(config.projectId, key, value);
      },
    },
    {
      get: (key: string) => {
        if (!isBrowser()) return null;
        return FlagStorageService.get(config.projectId, key);
      },
      set: (key: string, value: string) => {
        if (!isBrowser()) return;
        FlagStorageService.set(config.projectId, key, value);
      },
    },
    {
      get: (key: string) => {
        if (!isBrowser()) return null;
        return RemoteConfigStorageService.get(config.projectId, key);
      },
      set: (key: string, value: string) => {
        if (!isBrowser()) return;
        RemoteConfigStorageService.set(config.projectId, key, value);
      },
    }
  );

  type AbbyProjectData = ReturnType<typeof abby.getProjectData>;

  /**
   * Each app (and therefore each SSR request) gets its own reactive project
   * data, which is provided to every component below the provider via
   * `provide` / `inject`.
   */
  const ABBY_INJECTION_KEY: InjectionKey<ShallowRef<AbbyProjectData>> =
    Symbol("abby-project-data");

  /**
   * Throws a helpful error if the composable is used outside of an
   * `AbbyProvider`. This is the same behaviour as the React integration.
   */
  const useAbbyData = (): ShallowRef<AbbyProjectData> => {
    const data = inject(ABBY_INJECTION_KEY, null);

    if (!data) {
      throw new Error(
        "useAbbyData must be used within an AbbyProvider. Wrap a parent component in <AbbyProvider> to fix this error."
      );
    }

    return data;
  };

  const sendData = (type: AbbyEventType, testName: string, variant: string) => {
    HttpService.sendData({
      url: config.apiUrl,
      type,
      data: {
        projectId: config.projectId,
        selectedVariant: variant,
        testName,
      },
    });
  };

  /**
   * Returns the currently selected variant for the given test as well as an
   * `onAct` callback. The variant is a computed ref, so it stays in sync when
   * the project data is loaded, when the AB test is reset via the devtools or
   * when the local overrides change.
   */
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

    // Typescript loses the typing here, so we cast in favor of a better
    // developer experience (same as the react integration)
    const testName = name as unknown as TestName;

    // always return an empty string until the data has been loaded to avoid
    // SSR hydration mismatches, the server doesn't know the variant either
    const selectedVariant = computed(
      () => data.value.tests[testName]?.selectedVariant ?? ""
    );

    const variant = computed(() => {
      const current = selectedVariant.value;

      return (
        lookupObject ? lookupObject[current as TestVariant] : current
      ) as ABTestReturnValue<Lookup, TestVariant>;
    });

    // report a ping whenever the selected variant changes, just like the
    // React integration does on every render after a variant change
    watch(
      selectedVariant,
      (current) => {
        if (!current) return;
        sendData(AbbyEventType.PING, testName, current);
      },
      { immediate: true }
    );

    /**
     * This function can be called to indicate that something that uses the
     * selected variant has been rendered. It will automatically send the
     * selected variant to the server.
     */
    const onAct = () => {
      const current = selectedVariant.value;
      if (!current) return;

      sendData(AbbyEventType.ACT, testName, current);
    };

    return { variant, onAct };
  };

  /**
   * Returns the value of the given feature flag
   */
  const useFeatureFlag = (name: FlagName): ComputedRef<boolean> => {
    const data = useAbbyData();

    // flags which are not part of the project data fall back to the defaults
    // and dev overrides of the config, just like `getFeatureFlag` does
    return computed(
      () => data.value.flags[name]?.value ?? abby.getFeatureFlag(name)
    );
  };

  /**
   * Returns an array of all flags with their name and value
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

  /**
   * Returns the value of the given remote config variable
   */
  const useRemoteConfig = <
    T extends RemoteConfigName,
    Config extends RemoteConfig[T],
  >(
    remoteConfigName: T
  ): ComputedRef<RemoteConfigValueStringToType<Config>> => {
    const data = useAbbyData();

    return computed(
      () =>
        (data.value.remoteConfig[remoteConfigName]?.value ??
          abby.getRemoteConfig(
            remoteConfigName
          )) as RemoteConfigValueStringToType<Config>
    );
  };

  /**
   * Returns an array of all remote config variables with their name and value
   */
  const useRemoteConfigVariables = () => {
    const data = useAbbyData();

    return computed(() =>
      (Object.keys(data.value.remoteConfig) as Array<RemoteConfigName>).map(
        (configName) => ({
          name: configName,
          value: data.value.remoteConfig[configName].value,
        })
      )
    );
  };

  /**
   * Non reactive getter for a feature flag. Useful in event handlers and
   * anywhere a computed ref is not convenient.
   */
  const getFeatureFlagValue = (name: FlagName) => abby.getFeatureFlag(name);

  /**
   * Non reactive getter for a remote config variable
   */
  const getRemoteConfig = <
    T extends RemoteConfigName,
    Config extends RemoteConfig[T],
  >(
    remoteConfigName: T
  ): RemoteConfigValueStringToType<Config> =>
    abby.getRemoteConfig(remoteConfigName);

  /**
   * Non reactive getter for the currently selected variant of an AB test
   */
  const getABTestValue = <
    TestName_ extends keyof Tests,
    TestVariant extends Tests[TestName_]["variants"][number],
    LookupValue,
    const Lookup extends
      | Record<TestVariant, LookupValue>
      | undefined = undefined,
  >(
    testName: TestName_,
    lookupObject?: Lookup
  ): ABTestReturnValue<Lookup, TestVariant> => {
    const variant = abby.getTestVariant(testName);

    if (lookupObject === undefined) {
      // Typescript looses its typing here, so we cast as any in favor of
      // having better type inference for the user
      return variant as any;
    }

    return lookupObject[variant as TestVariant] as any;
  };

  /**
   * Simple helper function to create a function that resets an AB test
   */
  const getABResetFunction = <T extends keyof Tests>(name: T) => {
    return () => {
      TestStorageService.remove(config.projectId, name as string);
    };
  };

  /**
   * Simple helper function to get a list of all variants for a given test
   */
  const getVariants = <T extends keyof Tests>(name: T) =>
    abby.getVariants(name);

  const updateUserProperties = (
    user: Partial<{
      -readonly [K in keyof User]: Infer<User[K]>;
    }>
  ) => {
    abby.updateUserProperties(user);
  };

  /**
   * Provides the project data to all children. It loads the data from the
   * server on mount (unless `initialData` was passed, which is what Nuxt and
   * SSR setups should do) and subscribes to changes of the local overrides.
   */
  const AbbyProvider = defineComponent({
    name: "AbbyProvider",
    props: {
      initialData: {
        type: Object as PropType<AbbyDataResponse>,
        default: undefined,
      },
    },
    setup(props, { slots }) {
      const data = shallowRef<AbbyProjectData>(
        props.initialData ? abby.init(props.initialData) : abby.getProjectData()
      );

      let hasLoaded = false;
      let unsubscribe: (() => void) | null = null;

      const load = async () => {
        if (props.initialData || hasLoaded) return;
        hasLoaded = true;

        const newData = await abby.loadProjectData();
        if (newData) data.value = newData;
      };

      provide(ABBY_INJECTION_KEY, data);

      // subscribe to changes of the project data (devtools overrides,
      // local storage overrides, ...) and clean the subscription up when the
      // provider unmounts
      onMounted(() => {
        load();

        unsubscribe = abby.subscribe((newData) => {
          data.value = newData;
        });
      });

      onUnmounted(() => {
        unsubscribe?.();
        unsubscribe = null;
      });

      return () => slots.default?.();
    },
  });

  /**
   * Vue plugin, so the integration can be used with `app.use(AbbyPlugin)`
   * as well. It mounts the provider implicitly by providing the state on the
   * app level, which allows using the composables outside of a dedicated
   * provider component too.
   */
  const AbbyPlugin = {
    install(app: App, initialData?: AbbyDataResponse) {
      const data = shallowRef<AbbyProjectData>(
        initialData ? abby.init(initialData) : abby.getProjectData()
      );

      app.provide(ABBY_INJECTION_KEY, data);

      abby.subscribe((newData) => {
        data.value = newData;
      });

      if (!initialData && isBrowser()) {
        abby.loadProjectData().then((newData) => {
          if (newData) data.value = newData;
        });
      }
    },
  };

  return {
    useAbby,
    AbbyProvider,
    AbbyPlugin,
    useFeatureFlag,
    useFeatureFlags,
    useRemoteConfig,
    useRemoteConfigVariables,
    getFeatureFlagValue,
    getRemoteConfig,
    getABTestValue,
    getABResetFunction,
    getVariants,
    updateUserProperties,
    __abby__: abby,
  };
}
