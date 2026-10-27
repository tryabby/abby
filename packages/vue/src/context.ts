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
  type App,
  type ComputedRef,
  type InjectionKey,
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
  shallowRef,
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
) => ReturnType<typeof defineComponent>;

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

  const createAbbyInstance = () =>
    new Abby<
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
        set: (key: string, value: any, options?: StorageServiceOptions) => {
          if (typeof window === "undefined" || config.cookies?.disableByDefault)
            return;
          TestStorageService.set(abbyConfig.projectId, key, value, options);
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

  const abby = createAbbyInstance();
  let currentAbby = abby;

  type AbbyInstance = typeof abby;
  type AbbyProjectData = ReturnType<typeof abby.getProjectData>;

  const createImperativeApi = (targetAbby: AbbyInstance) => ({
    abby: targetAbby,
    getFeatureFlagValue: (name: FlagName) => targetAbby.getFeatureFlag(name),
    getRemoteConfig: <
      T extends RemoteConfigName,
      Config extends RemoteConfig[T],
    >(
      remoteConfigName: T
    ): RemoteConfigValueStringToType<Config> =>
      targetAbby.getRemoteConfig(remoteConfigName),
    getABTestValue: <
      TestKey extends keyof Tests,
      TestVariant extends Tests[TestKey]["variants"][number],
      LookupValue,
      const Lookup extends
        | Record<TestVariant, LookupValue>
        | undefined = undefined,
    >(
      testName: TestKey,
      lookupObject?: Lookup
    ): ABTestReturnValue<Lookup, TestVariant> => {
      const variant = targetAbby.getTestVariant(testName);
      if (lookupObject === undefined) {
        return variant as any;
      }
      return lookupObject[variant as TestVariant] as any;
    },
    updateUserProperties: (
      user: Partial<{
        -readonly [K in keyof User]: Infer<User[K]>;
      }>
    ) => {
      targetAbby.updateUserProperties(user);
    },
  });

  type AbbyImperativeApi = ReturnType<typeof createImperativeApi>;

  interface AbbyScopedContext extends AbbyImperativeApi {
    state: Ref<AbbyProjectData>;
  }

  const AbbyInjectionKey: InjectionKey<AbbyScopedContext> =
    Symbol("AbbyContext");

  const sharedState = shallowRef<AbbyProjectData>(abby.getProjectData());
  abby.subscribe((newData) => {
    sharedState.value = newData;
  });

  const defaultContext: AbbyScopedContext = {
    state: sharedState,
    ...createImperativeApi(abby),
  };

  const useAbbyContext = (): AbbyScopedContext => {
    if (getCurrentInstance()) {
      return inject(AbbyInjectionKey, defaultContext);
    }
    return {
      state: sharedState,
      ...createImperativeApi(currentAbby),
    };
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
    const { state: dataRef, abby: activeAbby } = useAbbyContext();
    const selectedVariant = ref<string>("");

    const sendPing = (variantVal: string) => {
      if (!name || !variantVal) return;
      HttpService.sendData({
        url: config.apiUrl,
        type: AbbyEventType.PING,
        data: {
          projectId: config.projectId,
          selectedVariant: variantVal,
          testName: name as string,
        },
      });
    };

    watch(
      () => dataRef.value.tests[name as unknown as TestName]?.selectedVariant,
      (newVariant) => {
        if (newVariant !== undefined && newVariant !== selectedVariant.value) {
          selectedVariant.value = newVariant;
          sendPing(newVariant);
        }
      }
    );

    onMounted(() => {
      const current =
        dataRef.value.tests[name as unknown as TestName]?.selectedVariant ??
        activeAbby.getProjectData().tests[name as unknown as TestName]
          ?.selectedVariant ??
        selectedVariant.value;
      if (current) {
        selectedVariant.value = current;
        sendPing(current);
      }
    });

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
      const raw = selectedVariant.value as TestVariant;
      if (lookupObject) {
        return lookupObject[raw] as any;
      }
      return raw as any;
    });

    return {
      variant,
      onAct,
    };
  };

  const useFeatureFlag = (name: FlagName): ComputedRef<boolean> => {
    const { state: dataRef, abby: activeAbby } = useAbbyContext();
    return computed(
      () =>
        dataRef.value.flags[name]?.value ?? activeAbby.getFeatureFlag(name)
    );
  };

  const useFeatureFlags = () => {
    const { state: dataRef, abby: activeAbby } = useAbbyContext();
    return computed(() =>
      (Object.keys(dataRef.value.flags) as Array<FlagName>).map((flagName) => ({
        name: flagName,
        value:
          dataRef.value.flags[flagName]?.value ??
          activeAbby.getFeatureFlag(flagName),
      }))
    );
  };

  const useRemoteConfig = <
    T extends RemoteConfigName,
    Config extends RemoteConfig[T],
  >(
    remoteConfigName: T
  ): ComputedRef<RemoteConfigValueStringToType<Config>> => {
    const { state: dataRef, abby: activeAbby } = useAbbyContext();
    return computed(
      () =>
        (dataRef.value.remoteConfig[remoteConfigName]?.value ??
          activeAbby.getRemoteConfig(
            remoteConfigName
          )) as RemoteConfigValueStringToType<Config>
    );
  };

  const useRemoteConfigVariables = () => {
    const { state: dataRef, abby: activeAbby } = useAbbyContext();
    return computed(
      () =>
        (
          Object.keys(dataRef.value.remoteConfig) as Array<RemoteConfigName>
        ).map((configName) => ({
          name: configName,
          value:
            dataRef.value.remoteConfig[configName]?.value ??
            activeAbby.getRemoteConfig(configName),
        })) as Array<{
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
    },
    setup(props, { slots, expose }) {
      const scopedAbby = props.initialData ? createAbbyInstance() : abby;
      currentAbby = scopedAbby;
      const stateRef = shallowRef<AbbyProjectData>(
        props.initialData
          ? scopedAbby.init(props.initialData)
          : scopedAbby.getProjectData()
      );

      const scopedApi = createImperativeApi(scopedAbby);
      provide(AbbyInjectionKey, { state: stateRef, ...scopedApi });
      expose(scopedApi);

      let unsubscribe: (() => void) | undefined;
      onMounted(() => {
        if (!props.initialData) {
          scopedAbby.loadProjectData().then((loaded) => {
            if (loaded) {
              stateRef.value = loaded;
            }
          });
        }
        stateRef.value = scopedAbby.getProjectData();
        unsubscribe = scopedAbby.subscribe((updated) => {
          stateRef.value = updated;
        });
      });

      onUnmounted(() => {
        if (unsubscribe) unsubscribe();
      });

      return () => (slots.default ? slots.default() : null);
    },
  });

  const install = (app: App, options?: { initialData?: AbbyDataResponse }) => {
    const scopedAbby = options?.initialData ? createAbbyInstance() : abby;
    currentAbby = scopedAbby;
    const appState = shallowRef<AbbyProjectData>(
      options?.initialData
        ? scopedAbby.init(options.initialData)
        : scopedAbby.getProjectData()
    );

    scopedAbby.subscribe((updated) => {
      appState.value = updated;
    });

    if (!options?.initialData && typeof window !== "undefined") {
      scopedAbby.loadProjectData().then((loaded) => {
        if (loaded) appState.value = loaded;
      });
    }

    const scopedApi = createImperativeApi(scopedAbby);
    const scopedContext: AbbyScopedContext = {
      state: appState,
      ...scopedApi,
    };

    app.provide(AbbyInjectionKey, scopedContext);
    app.config.globalProperties.$abby = scopedContext;
    return scopedApi;
  };

  const getFeatureFlagValue = (name: FlagName) => {
    return useAbbyContext().getFeatureFlagValue(name);
  };

  const getRemoteConfig = <
    T extends RemoteConfigName,
    Config extends RemoteConfig[T],
  >(
    remoteConfigName: T
  ): RemoteConfigValueStringToType<Config> => {
    return useAbbyContext().getRemoteConfig(remoteConfigName);
  };

  const getABTestValue = <
    TestKey extends keyof Tests,
    TestVariant extends Tests[TestKey]["variants"][number],
    LookupValue,
    const Lookup extends
      | Record<TestVariant, LookupValue>
      | undefined = undefined,
  >(
    testName: TestKey,
    lookupObject?: Lookup
  ): ABTestReturnValue<Lookup, TestVariant> => {
    return useAbbyContext().getABTestValue(testName, lookupObject);
  };

  const withDevtools: withDevtoolsFunction = (factory, props) => {
    return defineComponent({
      name: "AbbyDevtools",
      setup() {
        const { abby: activeAbby } = useAbbyContext();
        let destroy: (() => void) | undefined;
        onMounted(() => {
          if (
            !props?.dangerouslyForceShow &&
            process.env.NODE_ENV !== "development"
          ) {
            return;
          }
          destroy = factory.create({ ...props, abby: activeAbby });
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
    return useAbbyContext().abby.getVariants(name);
  };

  const updateUserProperties = (
    user: Partial<{
      -readonly [K in keyof User]: Infer<User[K]>;
    }>
  ) => {
    useAbbyContext().updateUserProperties(user);
  };

  return {
    useAbby,
    useAbbyContext,
    AbbyProvider,
    install,
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
