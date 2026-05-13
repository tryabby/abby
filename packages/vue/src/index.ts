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
  type Plugin,
  type Ref,
  computed,
  inject,
  onMounted,
  onUnmounted,
  ref,
} from "vue";
import {
  FlagStorageService,
  RemoteConfigStorageService,
  TestStorageService,
} from "./StorageService";

export { type ABConfig, type AbbyConfig, defineConfig } from "@tryabby/core";

export type ABTestReturnValue<Lookup, TestVariant> = Lookup extends undefined
  ? TestVariant
  : TestVariant extends keyof Lookup
    ? Lookup[TestVariant]
    : never;

type AbbyProjectData<
  FlagName extends string,
  TestName extends string,
  RemoteConfigName extends string,
> = ReturnType<
  Abby<FlagName, TestName, any, any, RemoteConfigName>["getProjectData"]
>;

type AbbyContextValue<
  FlagName extends string,
  TestName extends string,
  RemoteConfigName extends string,
> = {
  data: Ref<AbbyProjectData<FlagName, TestName, RemoteConfigName>>;
};

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
  config: AbbyConfig<
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
    config,
    {
      get: (key: string) => {
        if (typeof window === "undefined") return null;
        return TestStorageService.get(config.projectId, key);
      },
      set: (key: string, value: string, options) => {
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
      set: (key: string, value: string) => {
        if (typeof window === "undefined") return;
        FlagStorageService.set(config.projectId, key, value);
      },
    },
    {
      get: (key: string) => {
        if (typeof window === "undefined") return null;
        return RemoteConfigStorageService.get(config.projectId, key);
      },
      set: (key: string, value: string) => {
        if (typeof window === "undefined") return;
        RemoteConfigStorageService.set(config.projectId, key, value);
      },
    }
  );

  const AbbyInjectionKey = Symbol("Abby") as InjectionKey<
    AbbyContextValue<FlagName, TestName, RemoteConfigName>
  >;

  const data = ref(abby.getProjectData()) as Ref<
    AbbyProjectData<FlagName, TestName, RemoteConfigName>
  >;

  const syncData = () => {
    data.value = abby.getProjectData();
  };

  const AbbyPlugin: Plugin = {
    install(app: App, initialData?: AbbyDataResponse) {
      if (initialData) {
        data.value = abby.init(initialData);
      } else {
        syncData();
        abby.loadProjectData().then((loadedData) => {
          if (!loadedData) return;
          data.value = loadedData;
        });
      }

      abby.subscribe((newData) => {
        data.value = newData as AbbyProjectData<
          FlagName,
          TestName,
          RemoteConfigName
        >;
      });

      app.provide(AbbyInjectionKey, { data });
    },
  };

  const useAbbyData = () => {
    const context = inject(AbbyInjectionKey);

    if (!context) {
      throw new Error(
        "useAbbyData must be used after installing AbbyPlugin with app.use(AbbyPlugin)."
      );
    }

    return context.data;
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
    const projectData = useAbbyData();

    const selectedVariant = computed(() => {
      return (
        projectData.value.tests[name as unknown as TestName]?.selectedVariant ??
        abby.getTestVariant(name)
      );
    });

    const variant = computed(() => {
      return lookupObject
        ? lookupObject[selectedVariant.value as TestVariant]
        : (selectedVariant.value as any);
    });

    onMounted(() => {
      if (!name || !selectedVariant.value) return;

      HttpService.sendData({
        url: config.apiUrl,
        type: AbbyEventType.PING,
        data: {
          projectId: config.projectId,
          selectedVariant: selectedVariant.value,
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

    return { variant, onAct };
  };

  const useFeatureFlag = (name: FlagName): ComputedRef<boolean> => {
    const projectData = useAbbyData();
    return computed(() => projectData.value.flags[name].value);
  };

  const useRemoteConfig = <
    T extends RemoteConfigName,
    Config extends RemoteConfig[T],
  >(
    remoteConfigName: T
  ): ComputedRef<RemoteConfigValueStringToType<Config>> => {
    const projectData = useAbbyData();
    return computed(
      () =>
        projectData.value.remoteConfig[remoteConfigName]
          .value as RemoteConfigValueStringToType<Config>
    );
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

  const useAbbySync = () => {
    let unsubscribe: (() => void) | undefined;

    onMounted(() => {
      syncData();
      unsubscribe = abby.subscribe((newData) => {
        data.value = newData as AbbyProjectData<
          FlagName,
          TestName,
          RemoteConfigName
        >;
      });
    });

    onUnmounted(() => {
      unsubscribe?.();
    });
  };

  return {
    AbbyPlugin,
    useAbby,
    useFeatureFlag,
    useRemoteConfig,
    getFeatureFlagValue,
    getRemoteConfig,
    getABTestValue,
    __abby__: abby,
    getABResetFunction,
    getVariants,
    updateUserProperties,
    useAbbySync,
  };
}
