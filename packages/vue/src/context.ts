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
  type ComputedRef,
  type InjectionKey,
  type Plugin,
  type PropType,
  computed,
  defineComponent,
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

  const config = abbyConfig;

  type AbbyProjectData = ReturnType<typeof abby.getProjectData>;
  const abbyData = shallowRef<AbbyProjectData>(abby.getProjectData());

  abby.subscribe((data) => {
    abbyData.value = data;
  });

  const AbbyInjectionKey: InjectionKey<typeof abby> = Symbol("AbbyInstance");

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
    const initialVariant = abby.getTestVariant(name as unknown as TestName);

    if (name && initialVariant) {
      HttpService.sendData({
        url: config.apiUrl,
        type: AbbyEventType.PING,
        data: {
          projectId: config.projectId,
          selectedVariant: initialVariant,
          testName: name as string,
        },
      });
    }

    const variant = computed<ABTestReturnValue<Lookup, TestVariant>>(() => {
      // Establish reactive dependency on abbyData
      const _ = abbyData.value;
      const current = abby.getTestVariant(name as unknown as TestName);

      if (lookupObject === undefined) {
        return current as any;
      }

      return lookupObject[current as TestVariant] as any;
    });

    const onAct = () => {
      const current = abby.getTestVariant(name as unknown as TestName);
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

    return {
      variant,
      onAct,
    };
  };

  const useFeatureFlag = (name: FlagName): ComputedRef<boolean> => {
    return computed(() => {
      const data = abbyData.value;
      return data?.flags?.[name]?.value ?? abby.getFeatureFlag(name);
    });
  };

  const useFeatureFlags = (): ComputedRef<
    Array<{ name: FlagName; value: boolean }>
  > => {
    return computed(() => {
      const data = abbyData.value;
      return (Object.keys(data.flags) as Array<FlagName>).map((flagName) => ({
        name: flagName,
        value: data.flags[flagName].value,
      }));
    });
  };

  const useRemoteConfig = <
    T extends RemoteConfigName,
    Config extends RemoteConfig[T],
  >(
    remoteConfigName: T
  ): ComputedRef<RemoteConfigValueStringToType<Config>> => {
    return computed(() => {
      const data = abbyData.value;
      const val = data?.remoteConfig?.[remoteConfigName]?.value;
      return (
        val !== undefined ? val : abby.getRemoteConfig(remoteConfigName)
      ) as RemoteConfigValueStringToType<Config>;
    });
  };

  const useRemoteConfigVariables = (): ComputedRef<
    Array<{
      name: RemoteConfigName;
      value: RemoteConfigValueStringToType<RemoteConfig[RemoteConfigName]>;
    }>
  > => {
    return computed(() => {
      const data = abbyData.value;
      return (Object.keys(data.remoteConfig) as Array<RemoteConfigName>).map(
        (configName) => ({
          name: configName,
          value: data.remoteConfig[configName].value,
        })
      ) as Array<{
        name: RemoteConfigName;
        value: RemoteConfigValueStringToType<RemoteConfig[RemoteConfigName]>;
      }>;
    });
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

  const AbbyProvider = defineComponent({
    name: "AbbyProvider",
    props: {
      initialData: {
        type: Object as PropType<AbbyDataResponse>,
        required: false,
      },
    },
    setup(props, { slots }) {
      if (props.initialData) {
        const initData = abby.init(props.initialData);
        abbyData.value = initData;
      }
      provide(AbbyInjectionKey, abby);
      return () => slots.default?.();
    },
  });

  const AbbyPlugin: Plugin = {
    install(app: App, options?: { initialData?: AbbyDataResponse }) {
      if (options?.initialData) {
        const initData = abby.init(options.initialData);
        abbyData.value = initData;
      }
      app.provide(AbbyInjectionKey, abby);
    },
  };

  const withDevtools: withDevtoolsFunction = (factory, props) => {
    return defineComponent({
      name: "AbbyDevtools",
      setup() {
        onMounted(() => {
          if (
            !props?.dangerouslyForceShow &&
            process.env.NODE_ENV !== "development"
          ) {
            return;
          }
          const destroy = factory.create({ ...props, abby });
          onUnmounted(() => {
            destroy();
          });
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
    AbbyProvider,
    AbbyPlugin,
  };
}
