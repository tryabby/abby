import {
  type ABConfig,
  Abby,
  type AbbyConfig,
  type RemoteConfigValueString,
  type RemoteConfigValueStringToType,
  type ValidatorType,
  HttpService,
  type AbbyDataResponse,
  AbbyEventType,
} from "@tryabby/core";
import type { Infer } from "@tryabby/core/validation";
import type { AbbyDevtoolProps, DevtoolsFactory } from "@tryabby/devtools";
import {
  computed,
  defineComponent,
  hasInjectionContext,
  inject,
  onMounted,
  onUnmounted,
  provide,
  ref,
  shallowRef,
  watch,
  type App,
  type ComputedRef,
  type InjectionKey,
  type Plugin,
  type PropType,
  type Ref,
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
) => any;

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

  const ABBY_INJECTION_KEY: InjectionKey<Ref<AbbyProjectData>> = Symbol(
    `abby_data_${abbyConfig.projectId}`
  );

  const config = abbyConfig;

  // Shared reactive ref for default fallback / single-instance applications
  const rootDataRef = shallowRef<AbbyProjectData>(abby.getProjectData());

  if (typeof window !== "undefined") {
    abby.subscribe((data: AbbyProjectData) => {
      rootDataRef.value = data;
    });
  }

  const useAbbyData = (): Ref<AbbyProjectData> => {
    if (hasInjectionContext()) {
      const injected = inject(ABBY_INJECTION_KEY, null);
      if (injected) return injected;
    }
    return rootDataRef;
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

    const selectedVariant = ref<string>(
      dataRef.value.tests[name as unknown as TestName]?.selectedVariant ??
        abby.getTestVariant(name as any) ??
        ""
    );

    // Watch for updates from core project data
    watch(
      () => dataRef.value.tests[name as unknown as TestName]?.selectedVariant,
      (newVariant) => {
        if (newVariant !== undefined) {
          selectedVariant.value = newVariant;
        }
      },
      { immediate: true }
    );

    // Trigger PING event on variant resolution
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
      if (!current) return;

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

    const variant = computed<ABTestReturnValue<Lookup, TestVariant>>(() => {
      const current = selectedVariant.value;
      if (lookupObject) {
        return lookupObject[current as TestVariant];
      }
      return current as any;
    });

    return {
      variant,
      onAct,
    };
  };

  const useFeatureFlag = (name: FlagName): ComputedRef<boolean> => {
    const dataRef = useAbbyData();
    return computed(() => {
      return dataRef.value.flags[name]?.value ?? false;
    });
  };

  const useFeatureFlags = (): ComputedRef<
    Array<{ name: FlagName; value: boolean }>
  > => {
    const dataRef = useAbbyData();
    return computed(() => {
      const flags = dataRef.value.flags || {};
      return (Object.keys(flags) as Array<FlagName>).map((flagName) => ({
        name: flagName,
        value: flags[flagName].value,
      }));
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
      return dataRef.value.remoteConfig[remoteConfigName]
        ?.value as RemoteConfigValueStringToType<Config>;
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
      const remoteConfig = dataRef.value.remoteConfig || {};
      return (Object.keys(remoteConfig) as Array<RemoteConfigName>).map(
        (configName) => ({
          name: configName,
          value: remoteConfig[configName].value,
        })
      ) as Array<{
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
      const providerDataRef = shallowRef<AbbyProjectData>(
        props.initialData ? abby.init(props.initialData) : abby.getProjectData()
      );

      onMounted(() => {
        if (!props.initialData) {
          abby.loadProjectData().then((loaded) => {
            if (loaded) {
              providerDataRef.value = loaded;
            }
          });
        }
      });

      const unsubscribe = abby.subscribe((updated: AbbyProjectData) => {
        providerDataRef.value = updated;
      });

      onUnmounted(() => {
        unsubscribe();
      });

      provide(ABBY_INJECTION_KEY, providerDataRef);

      return () => (slots.default ? slots.default() : null);
    },
  });

  const AbbyPlugin: Plugin = {
    install(app: App, options?: { initialData?: AbbyDataResponse }) {
      if (options?.initialData) {
        rootDataRef.value = abby.init(options.initialData);
      } else if (typeof window !== "undefined") {
        abby.loadProjectData().then((loaded) => {
          if (loaded) {
            rootDataRef.value = loaded;
          }
        });
      }
      app.provide(ABBY_INJECTION_KEY, rootDataRef);
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
        let destroy: (() => void) | null = null;
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
          if (destroy) destroy();
        });
        return () => null;
      },
    });
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
