import {
  type ABConfig,
  Abby,
  type AbbyConfig,
  type AbbyDataResponse,
  AbbyEventType,
  HttpService,
  type RemoteConfigValueString,
  type RemoteConfigValueStringToType,
  type StorageServiceOptions,
  type ValidatorType,
} from "@tryabby/core";
import type { Infer } from "@tryabby/core/validation";
import type { AbbyDevtoolProps, DevtoolsFactory } from "@tryabby/devtools";
import {
  type Component,
  type ComputedRef,
  type InjectionKey,
  type PropType,
  type Ref,
  computed,
  defineComponent,
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

  const AbbyDataKey: InjectionKey<Ref<AbbyProjectData>> = Symbol("abby-data");

  const useAbbyData = () => {
    const data = inject(AbbyDataKey);

    if (!data) {
      throw new Error(
        "useAbbyData must be used within an AbbyProvider. Wrap a parent component in <AbbyProvider> to fix this error."
      );
    }

    return data;
  };

  // we need to return the config as a const so that the types are narrowed
  const config = abbyConfig;

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

    // always render an empty string on the first render to avoid SSR mismatches
    // because the server does not know which variant to render
    const selectedVariant = ref<string>("");

    const readSelectedVariant = () =>
      data.value.tests[name as unknown as TestName]?.selectedVariant;

    // listen to changes for the current variant
    watch(readSelectedVariant, (newVariant) => {
      // should never be undefined after mount
      if (newVariant !== undefined) {
        selectedVariant.value = newVariant;
      }
    });

    // lazily resolve the variant on the client after mount
    // (onMounted never runs during SSR, so the server keeps rendering "")
    onMounted(() => {
      selectedVariant.value =
        abby.getProjectData().tests[name as unknown as TestName]
          ?.selectedVariant ?? "";
    });

    watch(selectedVariant, (variant) => {
      if (!name || !variant) return;

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

    const variant = computed(
      () =>
        (lookupObject
          ? lookupObject[selectedVariant.value as TestVariant]
          : // Typescript fails here. If we cast selectedVariant to TestVariant
            // it still assumes that it is a string. So we cast it to any instead
            (selectedVariant.value as any)) as ABTestReturnValue<
          Lookup,
          TestVariant
        >
    );

    return {
      /**
       * This function can be called to indicate that something that
       * uses the selected variant has been rendered.
       * It will automatically send the selected variant to the server.
       */
      onAct: onAct,
      variant,
    };
  };

  const useFeatureFlag = (name: FlagName): ComputedRef<boolean> => {
    const data = useAbbyData();
    return computed(() => {
      // accessing data.value keeps this subscribed to provider updates;
      // the core fallback covers dev overrides, defaults and fallback values
      // when the response omits the flag instead of crashing on undefined.
      const record = data.value.flags[name];
      if (record !== undefined) return record.value;
      return abby.getFeatureFlag(name);
    });
  };

  /**
   * Returns a computed Array of all flags with their name and value
   */
  const useFeatureFlags = (): ComputedRef<
    Array<{ name: FlagName; value: boolean }>
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
   * Returns a computed Array of all remote config variables with their name and value
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
        default: undefined,
      },
    },
    setup(props, { slots }) {
      const initial: AbbyProjectData = props.initialData
        ? abby.init(props.initialData)
        : abby.getProjectData();
      // cast: ref() only wraps the root value, so no nested unwrapping
      // happens at runtime; the cast keeps the LocalData typing intact
      const data = ref(initial) as Ref<AbbyProjectData>;

      let isMounted = false;

      // load the project data if it has not been passed in
      onMounted(() => {
        if (props.initialData || isMounted) return;
        isMounted = true;

        // seed the data with the initial data
        abby.loadProjectData().then((loaded) => {
          if (!loaded) return;
          data.value = loaded;
        });
      });

      // subscribe to changes in the project data
      const unsubscribe = abby.subscribe((newData) => {
        data.value = newData as AbbyProjectData;
      });
      onUnmounted(() => {
        unsubscribe();
      });

      provide(AbbyDataKey, data);

      return () => slots.default?.();
    },
  });

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
          .value as RemoteConfigValueStringToType<Config>
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
    // Typescript looses its typing here, so we cast as any in favor of having
    // better type inference for the user
    if (lookupObject === undefined) {
      return variant as any;
    }

    return lookupObject[variant as TestVariant] as any;
  };

  const withDevtools: withDevtoolsFunction = (factory, props) => {
    // hacky way to make sure SSR works: onMounted never runs on the server
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
    useAbby,
    AbbyProvider,
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
  };
}
