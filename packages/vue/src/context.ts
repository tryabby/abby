import {
  type ABConfig,
  Abby,
  type AbbyConfig,
  type RemoteConfigValueString,
  type RemoteConfigValueStringToType,
  type ValidatorType,
  type StorageServiceOptions,
  HttpService,
  type AbbyDataResponse,
  AbbyEventType,
} from "@tryabby/core";
import type { Infer } from "@tryabby/core/validation";
import type { AbbyDevtoolProps, DevtoolsFactory } from "@tryabby/devtools";
import {
  ref,
  shallowRef,
  computed,
  inject,
  provide,
  onMounted,
  onUnmounted,
  watch,
  defineComponent,
  type InjectionKey,
  type App,
  type Ref,
  type ShallowRef,
  type ComputedRef,
  type PropType,
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
) => () => void;

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
      set: (key: string, value: any, options?: StorageServiceOptions) => {
        if (typeof window === "undefined" || config.cookies?.disableByDefault)
          return;
        TestStorageService.set(config.projectId, key, value, options);
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

  const AbbyContextKey: InjectionKey<ShallowRef<AbbyProjectData | null>> = Symbol("AbbyContext");

  const useAbbyData = (): ShallowRef<AbbyProjectData> => {
    const dataRef = inject(AbbyContextKey, null);

    if (!dataRef || !dataRef.value) {
      throw new Error(
        "useAbbyData must be used within an AbbyProvider. Wrap a parent component in <AbbyProvider> to fix this error."
      );
    }

    return dataRef as ShallowRef<AbbyProjectData>;
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
    const dataRef = useAbbyData();

    const selectedVariant = computed(() => {
      return (
        dataRef.value.tests[name as unknown as TestName]?.selectedVariant ?? ""
      );
    });

    watch(
      selectedVariant,
      (newVal) => {
        if (!name || !newVal) return;

        HttpService.sendData({
          url: config.apiUrl,
          type: AbbyEventType.PING,
          data: {
            projectId: config.projectId,
            selectedVariant: newVal,
            testName: name as string,
          },
        });
      },
      { immediate: true }
    );

    const onAct = () => {
      const current = selectedVariant.value;
      if (!name || !current) return;

      HttpService.sendData({
        url: config.apiUrl,
        type: AbbyEventType.ACT,
        data: {
          projectId: config.projectId,
          selectedVariant: current,
          testName: name as string,
        },
      });
    };

    const variant = computed(() => {
      const current = selectedVariant.value;
      if (lookupObject === undefined) {
        return current as ABTestReturnValue<Lookup, TestVariant>;
      }
      return lookupObject[current as TestVariant] as ABTestReturnValue<
        Lookup,
        TestVariant
      >;
    });

    return {
      variant,
      onAct,
    };
  };

  const useFeatureFlag = (name: FlagName): ComputedRef<boolean> => {
    const dataRef = useAbbyData();
    return computed(() => {
      const flag = dataRef.value.flags[name];
      return flag ? Boolean(flag.value) : abby.getFeatureFlag(name);
    });
  };

  const useRemoteConfig = <
    T extends RemoteConfigName,
    Config extends RemoteConfig[T],
  >(
    remoteConfigName: T
  ): ComputedRef<RemoteConfigValueStringToType<Config>> => {
    const dataRef = useAbbyData();
    return computed(() => {
      const rc = dataRef.value.remoteConfig[remoteConfigName];
      if (rc != null) {
        return rc.value as RemoteConfigValueStringToType<Config>;
      }
      try {
        return abby.getRemoteConfig(remoteConfigName);
      } catch {
        const fallback =
          config.settings?.remoteConfig?.fallbackValues?.[remoteConfigName];
        if (fallback !== undefined) {
          return fallback as RemoteConfigValueStringToType<Config>;
        }
        const defaultKey = config.remoteConfig?.[remoteConfigName];
        const defaultValue = defaultKey
          ? config.settings?.remoteConfig?.defaultValues?.[defaultKey]
          : undefined;
        return (defaultValue ??
          undefined) as unknown as RemoteConfigValueStringToType<Config>;
      }
    });
  };

  const useFeatureFlags = (): ComputedRef<
    Array<{ name: FlagName; value: boolean }>
  > => {
    const dataRef = useAbbyData();
    return computed(() => {
      return (Object.keys(dataRef.value.flags) as Array<FlagName>).map(
        (flagName) => ({
          name: flagName,
          value: dataRef.value.flags[flagName].value,
        })
      );
    });
  };

  const useRemoteConfigVariables = (): ComputedRef<
    Array<{
      name: RemoteConfigName;
      value: RemoteConfigValueStringToType<RemoteConfig[RemoteConfigName]>;
    }>
  > => {
    const dataRef = useAbbyData();
    return computed(() => {
      return (
        Object.keys(dataRef.value.remoteConfig) as Array<RemoteConfigName>
      ).map((configName) => ({
        name: configName,
        value: dataRef.value.remoteConfig[configName].value,
      })) as Array<{
        name: RemoteConfigName;
        value: RemoteConfigValueStringToType<RemoteConfig[RemoteConfigName]>;
      }>;
    });
  };

  const AbbyProvider = defineComponent({
    name: "AbbyProvider",
    props: {
      initialData: {
        type: Object as PropType<AbbyDataResponse>,
        required: false,
      },
    },
    setup(props, { slots }) {
      const isMountedRef = ref(false);
      const dataRef = shallowRef<AbbyProjectData | null>(
        props.initialData ? abby.init(props.initialData) : abby.getProjectData()
      );

      provide(AbbyContextKey, dataRef);

      onMounted(() => {
        if (props.initialData || isMountedRef.value) return;
        isMountedRef.value = true;

        abby.loadProjectData().then((loadedData) => {
          if (!loadedData) return;
          dataRef.value = loadedData;
        });
      });

      let unsubscribe: (() => void) | null = null;
      unsubscribe = abby.subscribe((updatedData) => {
        dataRef.value = updatedData;
      });

      onUnmounted(() => {
        if (unsubscribe) {
          unsubscribe();
        }
      });

      return () => slots.default?.();
    },
  });

  const AbbyPlugin = {
    install(app: App, options?: { initialData?: AbbyDataResponse }) {
      const dataRef = shallowRef<AbbyProjectData | null>(
        options?.initialData
          ? abby.init(options.initialData)
          : abby.getProjectData()
      );

      app.provide(AbbyContextKey, dataRef);

      if (!options?.initialData) {
        abby.loadProjectData().then((loadedData) => {
          if (!loadedData) return;
          dataRef.value = loadedData;
        });
      }

      abby.subscribe((updatedData) => {
        dataRef.value = updatedData;
      });
    },
  };

  const getFeatureFlagValue = (name: FlagName): boolean => {
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
    TTestName extends keyof Tests,
    TestVariant extends Tests[TTestName]["variants"][number],
    LookupValue,
    const Lookup extends
      | Record<TestVariant, LookupValue>
      | undefined = undefined,
  >(
    testName: TTestName,
    lookupObject?: Lookup
  ): ABTestReturnValue<Lookup, TestVariant> => {
    const variant = abby.getTestVariant(testName);
    if (lookupObject === undefined) {
      return variant as any;
    }
    return lookupObject[variant as TestVariant] as any;
  };

  const withDevtools: withDevtoolsFunction = (factory, props) => {
    return () => {
      if (
        !props?.dangerouslyForceShow &&
        typeof process !== "undefined" &&
        process.env?.NODE_ENV !== "development"
      ) {
        return;
      }

      const destroy = factory.create({ ...props, abby });
      return () => {
        destroy();
      };
    };
  };

  const getABResetFunction = <T extends keyof Tests>(name: T) => {
    return () => {
      TestStorageService.remove(config.projectId, name as string);
    };
  };

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
    AbbyPlugin,
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
