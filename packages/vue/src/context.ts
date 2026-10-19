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

  const AbbySymbol: InjectionKey<ShallowRef<AbbyProjectData>> =
    Symbol("AbbyContext");

  const defaultDataRef = shallowRef<AbbyProjectData>(abby.getProjectData());
  abby.subscribe((newData) => {
    defaultDataRef.value = newData;
  });

  const useAbbyDataRef = (): ShallowRef<AbbyProjectData> => {
    if (getCurrentInstance()) {
      const injected = inject(AbbySymbol, null);
      if (injected) {
        return injected;
      }
    }
    return defaultDataRef;
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
    const dataRef = useAbbyDataRef();
    const resolveSelectedVariant = () =>
      dataRef.value.tests[name as unknown as TestName]?.selectedVariant ??
      abby.getTestVariant(name) ??
      "";

    const initialSelectedVariant = resolveSelectedVariant();

    if (name && initialSelectedVariant) {
      HttpService.sendData({
        url: config.apiUrl,
        type: AbbyEventType.PING,
        data: {
          projectId: config.projectId,
          selectedVariant: initialSelectedVariant,
          testName: name as string,
        },
      });
    }

    const onAct = () => {
      const currentVariant = resolveSelectedVariant();
      if (!currentVariant) return;

      HttpService.sendData({
        url: config.apiUrl,
        type: AbbyEventType.ACT,
        data: {
          projectId: config.projectId,
          selectedVariant: currentVariant,
          testName: name as string,
        },
      });
    };

    const variant = computed<ABTestReturnValue<Lookup, TestVariant>>(() => {
      const selectedVariant = resolveSelectedVariant();
      return lookupObject
        ? (lookupObject[selectedVariant as TestVariant] as any)
        : (selectedVariant as any);
    });

    return {
      onAct,
      variant,
    };
  };

  const useFeatureFlag = (name: FlagName): ComputedRef<boolean> => {
    const dataRef = useAbbyDataRef();
    return computed(() => dataRef.value.flags[name].value);
  };

  const useFeatureFlags = (): ComputedRef<
    Array<{ name: FlagName; value: boolean }>
  > => {
    const dataRef = useAbbyDataRef();
    return computed(() =>
      (Object.keys(dataRef.value.flags) as Array<FlagName>).map((flagName) => ({
        name: flagName,
        value: dataRef.value.flags[flagName].value,
      }))
    );
  };

  const useRemoteConfig = <
    T extends RemoteConfigName,
    Config extends RemoteConfig[T],
  >(
    remoteConfigName: T
  ): ComputedRef<RemoteConfigValueStringToType<Config>> => {
    const dataRef = useAbbyDataRef();
    return computed(
      () =>
        dataRef.value.remoteConfig[remoteConfigName]
          .value as RemoteConfigValueStringToType<Config>
    );
  };

  const useRemoteConfigVariables = (): ComputedRef<
    Array<{
      name: RemoteConfigName;
      value: RemoteConfigValueStringToType<RemoteConfig[RemoteConfigName]>;
    }>
  > => {
    const dataRef = useAbbyDataRef();
    return computed(
      () =>
        (Object.keys(dataRef.value.remoteConfig) as Array<RemoteConfigName>).map(
          (configName) => ({
            name: configName,
            value: dataRef.value.remoteConfig[configName].value,
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
    },
    setup(props, { slots }) {
      const dataRef = shallowRef<AbbyProjectData>(
        props.initialData
          ? abby.init(props.initialData)
          : abby.getProjectData()
      );

      provide(AbbySymbol, dataRef);

      let unsubscribe: (() => void) | undefined;

      onMounted(() => {
        if (!props.initialData) {
          abby.loadProjectData().then((loadedData) => {
            if (loadedData) {
              dataRef.value = loadedData;
            }
          });
        }

        unsubscribe = abby.subscribe((updatedData) => {
          dataRef.value = updatedData;
        });
      });

      onUnmounted(() => {
        unsubscribe?.();
      });

      return () => slots.default?.();
    },
  });

  const AbbyPlugin = {
    install(app: App, options?: { initialData?: AbbyDataResponse }) {
      const dataRef = shallowRef<AbbyProjectData>(
        options?.initialData
          ? abby.init(options.initialData)
          : abby.getProjectData()
      );
      app.provide(AbbySymbol, dataRef);

      if (!options?.initialData && typeof window !== "undefined") {
        abby.loadProjectData().then((loadedData) => {
          if (loadedData) {
            dataRef.value = loadedData;
          }
        });
      }

      abby.subscribe((updatedData) => {
        dataRef.value = updatedData;
      });
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
