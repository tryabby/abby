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

  const AbbyInjectionKey: InjectionKey<ComputedRef<AbbyProjectData>> =
    Symbol("AbbyContext");

  // Fallback reactive project data ref for plugin installation or standalone usage
  const globalDataRef = ref<AbbyProjectData>(abby.getProjectData());
  let globalSubscribed = false;

  const ensureGlobalSubscription = () => {
    if (!globalSubscribed) {
      globalSubscribed = true;
      abby.subscribe((newData) => {
        globalDataRef.value = newData;
      });
    }
  };

  const useAbbyData = (): ComputedRef<AbbyProjectData> => {
    const instance = getCurrentInstance();
    if (instance) {
      const injected = inject(AbbyInjectionKey, null);
      if (injected) {
        return injected;
      }
    }
    ensureGlobalSubscription();
    return computed(() => globalDataRef.value);
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
    variant: ABTestReturnValue<Lookup, TestVariant>;
    variantRef: ComputedRef<ABTestReturnValue<Lookup, TestVariant>>;
    onAct: () => void;
  } => {
    const dataRef = useAbbyData();

    const getSelectedVariant = (): string => {
      return (
        dataRef.value.tests[name as unknown as TestName]?.selectedVariant ??
        abby.getProjectData().tests[name as unknown as TestName]
          ?.selectedVariant ??
        ""
      );
    };

    const sendPing = (selectedVariant: string) => {
      if (!name || !selectedVariant) return;
      HttpService.sendData({
        url: config.apiUrl,
        type: AbbyEventType.PING,
        data: {
          projectId: config.projectId,
          selectedVariant,
          testName: name as string,
        },
      });
    };

    const initialVariant = getSelectedVariant();
    if (initialVariant) {
      sendPing(initialVariant);
    }

    const variantRef = computed<ABTestReturnValue<Lookup, TestVariant>>(() => {
      const selected = getSelectedVariant();
      if (lookupObject) {
        return lookupObject[selected as TestVariant] as ABTestReturnValue<
          Lookup,
          TestVariant
        >;
      }
      return selected as unknown as ABTestReturnValue<Lookup, TestVariant>;
    });

    if (getCurrentInstance()) {
      watch(
        () => dataRef.value.tests[name as unknown as TestName]?.selectedVariant,
        (newVariant) => {
          if (newVariant) {
            sendPing(newVariant);
          }
        }
      );
    }

    const onAct = () => {
      const selectedVariant = getSelectedVariant();
      if (!selectedVariant) return;

      HttpService.sendData({
        url: config.apiUrl,
        type: AbbyEventType.ACT,
        data: {
          projectId: config.projectId,
          selectedVariant,
          testName: name as string,
        },
      });
    };

    return {
      variant: variantRef.value,
      variantRef,
      onAct,
    };
  };

  const useFeatureFlag = (name: FlagName): boolean => {
    const dataRef = useAbbyData();
    return dataRef.value.flags[name].value;
  };

  const useFeatureFlags = () => {
    const dataRef = useAbbyData();
    return (Object.keys(dataRef.value.flags) as Array<FlagName>).map(
      (flagName) => ({
        name: flagName,
        value: dataRef.value.flags[flagName].value,
      })
    );
  };

  const useRemoteConfig = <
    T extends RemoteConfigName,
    Config extends RemoteConfig[T],
  >(
    remoteConfigName: T
  ): RemoteConfigValueStringToType<Config> => {
    const dataRef = useAbbyData();
    return dataRef.value.remoteConfig[remoteConfigName]
      .value as RemoteConfigValueStringToType<Config>;
  };

  const useRemoteConfigVariables = () => {
    const dataRef = useAbbyData();
    return (
      Object.keys(dataRef.value.remoteConfig) as Array<RemoteConfigName>
    ).map((configName) => ({
      name: configName,
      value: dataRef.value.remoteConfig[configName].value,
    })) as Array<{
      name: RemoteConfigName;
      value: RemoteConfigValueStringToType<RemoteConfig[RemoteConfigName]>;
    }>;
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
      const localData = ref<AbbyProjectData>(
        props.initialData
          ? abby.init(props.initialData)
          : abby.getProjectData()
      );

      let unsubscribe: (() => void) | null = null;

      onMounted(() => {
        if (!props.initialData) {
          abby.loadProjectData().then((loaded) => {
            if (loaded) {
              localData.value = loaded;
            }
          });
        }
        unsubscribe = abby.subscribe((updated) => {
          localData.value = updated;
        });
      });

      onUnmounted(() => {
        if (unsubscribe) {
          unsubscribe();
        }
      });

      provide(
        AbbyInjectionKey,
        computed(() => localData.value)
      );

      return () => (slots.default ? slots.default() : null);
    },
  });

  const abbyPlugin = {
    install(app: App, options?: { initialData?: AbbyDataResponse }) {
      if (options?.initialData) {
        globalDataRef.value = abby.init(options.initialData);
      } else {
        globalDataRef.value = abby.getProjectData();
      }
      ensureGlobalSubscription();
      app.provide(
        AbbyInjectionKey,
        computed(() => globalDataRef.value)
      );
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
    K extends keyof Tests,
    TestVariant extends Tests[K]["variants"][number],
    LookupValue,
    const Lookup extends
      | Record<TestVariant, LookupValue>
      | undefined = undefined,
  >(
    testName: K,
    lookupObject?: Lookup
  ): ABTestReturnValue<Lookup, TestVariant> => {
    const variant = abby.getTestVariant(testName as unknown as TestName);
    if (lookupObject === undefined) {
      return variant as any;
    }
    return lookupObject[variant as TestVariant] as any;
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
    abbyPlugin,
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
