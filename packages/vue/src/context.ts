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
  ref,
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
    abbyConfig,
    {
      get: (key: string) => {
        if (typeof window === "undefined") return null;
        return TestStorageService.get(abbyConfig.projectId, key);
      },
      set: (key: string, value: any) => {
        if (typeof window === "undefined" || config.cookies?.disableByDefault)
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

  type AbbyProjectData = ReturnType<typeof abby.getProjectData>;

  type AbbyContext = {
    data: ShallowRef<AbbyProjectData>;
    abby: typeof abby;
  };

  const AbbyContextKey: InjectionKey<AbbyContext> = Symbol("abby");

  const useAbbyData = (): AbbyContext => {
    const context = inject(AbbyContextKey, null);

    if (!context) {
      throw new Error(
        "useAbbyData must be used within an AbbyProvider. Wrap a parent component in <AbbyProvider> to fix this error."
      );
    }

    return context;
  };

  /**
   * Composable to access the value of an A/B test.
   * @param name the name of the test
   * @param lookupObject an optional object to map the selected variant to a value
   * @returns the selected variant (as a computed ref) and an `onAct` function
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
    const { data } = useAbbyData();

    // always return an empty string on the first render to avoid SSR mismatches
    // because the server doesn't know which variant to render
    const isMounted = ref(false);
    onMounted(() => {
      isMounted.value = true;
    });

    const selectedVariant = computed(() => {
      if (!isMounted.value) return "";
      return (
        data.value.tests[name as unknown as TestName]?.selectedVariant ?? ""
      );
    });

    watch(
      selectedVariant,
      (variant) => {
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
      },
      { immediate: true }
    );

    const onAct = () => {
      const variant = selectedVariant.value;
      if (!variant) return;

      HttpService.sendData({
        url: config.apiUrl,
        type: AbbyEventType.ACT,
        data: {
          projectId: config.projectId,
          selectedVariant: variant,
          testName: name as string,
        },
      });
    };

    const variant = computed<ABTestReturnValue<Lookup, TestVariant>>(() => {
      const currentVariant = selectedVariant.value;

      return (
        lookupObject
          ? lookupObject[currentVariant as TestVariant]
          : currentVariant
      ) as ABTestReturnValue<Lookup, TestVariant>;
    });

    return {
      /**
       * A computed ref containing the selected variant.
       */
      variant,
      /**
       * This function can be called to indicate that something that
       * uses the selected variant has been rendered.
       * It will automatically send the selected variant to the server.
       */
      onAct,
    };
  };

  /**
   * Composable to access the value of a feature flag.
   * @param name the name of the feature flag
   * @returns a computed ref containing the value of the flag
   */
  const useFeatureFlag = (name: FlagName): ComputedRef<boolean> => {
    const { data } = useAbbyData();
    return computed(() => data.value.flags[name]?.value ?? false);
  };

  /**
   * Returns a computed ref of all flags with their name and value
   */
  const useFeatureFlags = (): ComputedRef<
    Array<{ name: FlagName; value: boolean }>
  > => {
    const { data } = useAbbyData();
    return computed(() =>
      (Object.keys(data.value.flags) as Array<FlagName>).map((flagName) => ({
        name: flagName,
        value: data.value.flags[flagName].value,
      }))
    );
  };

  /**
   * Returns a computed ref of all remote config variables with their name and value
   */
  const useRemoteConfigVariables = (): ComputedRef<
    Array<{
      name: RemoteConfigName;
      value: RemoteConfigValueStringToType<RemoteConfig[RemoteConfigName]>;
    }>
  > => {
    const { data } = useAbbyData();
    return computed(() =>
      (Object.keys(data.value.remoteConfig) as Array<RemoteConfigName>).map(
        (configName) => ({
          name: configName,
          value: data.value.remoteConfig[configName]
            .value as RemoteConfigValueStringToType<
            RemoteConfig[RemoteConfigName]
          >,
        })
      )
    );
  };

  /**
   * Composable to access the value of a remote config variable.
   * @param remoteConfigName the name of the remote config variable
   * @returns a computed ref containing the value of the remote config variable
   */
  const useRemoteConfig = <
    T extends RemoteConfigName,
    Config extends RemoteConfig[T],
  >(
    remoteConfigName: T
  ): ComputedRef<RemoteConfigValueStringToType<Config>> => {
    const { data } = useAbbyData();
    return computed(
      () =>
        data.value.remoteConfig[remoteConfigName]
          .value as RemoteConfigValueStringToType<Config>
    );
  };

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

      provide(AbbyContextKey, { data, abby });

      let unsubscribe: (() => void) | undefined;

      onMounted(() => {
        data.value = abby.getProjectData();
        unsubscribe = abby.subscribe((newData) => {
          data.value = newData;
        });

        if (props.initialData) return;

        abby.loadProjectData().then((newData) => {
          if (!newData) return;
          data.value = newData;
        });
      });

      onUnmounted(() => {
        unsubscribe?.();
      });

      return () => slots.default?.() ?? null;
    },
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
    // Typescript loses its typing here, so we cast as any in favor of having
    // better type inference for the user
    if (lookupObject === undefined) {
      return variant as any;
    }

    return lookupObject[variant as TestVariant] as any;
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

  const updateUserProperties = (
    user: Partial<{
      -readonly [K in keyof User]: Infer<User[K]>;
    }>
  ) => {
    abby.updateUserProperties(user);
  };

  return {
    useAbby,
    AbbyProvider,
    useFeatureFlag,
    getFeatureFlagValue,
    useRemoteConfig,
    getRemoteConfig,
    getABTestValue,
    __abby__: abby,
    getABResetFunction,
    getVariants,
    useFeatureFlags,
    useRemoteConfigVariables,
    updateUserProperties,
  };
}
