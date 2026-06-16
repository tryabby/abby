import {
  type ABConfig,
  Abby,
  type AbbyConfig,
  type RemoteConfigValueString,
  type RemoteConfigValueStringToType,
  type ValidatorType,
} from "@tryabby/core";
import { HttpService } from "@tryabby/core";
import { AbbyEventType } from "@tryabby/core";
import type { Infer } from "@tryabby/core/validation";
import { type ComputedRef, computed, inject, provide, shallowRef, type ShallowRef, watch } from "vue";
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

const ABBY_INJECT_KEY = Symbol("abby");

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

  const config = abbyConfig;
  const abbyDataRef = shallowRef<AbbyProjectData | null>(abby.getProjectData());

  let isLoaderInitialized = false;
  const initGlobalLoader = () => {
    if (isLoaderInitialized) return;
    isLoaderInitialized = true;
    if (typeof window !== "undefined") {
      abby.loadProjectData().then((data) => {
        if (data) {
          abbyDataRef.value = data;
        }
      });

      abby.subscribe((data) => {
        abbyDataRef.value = data;
      });
    }
  };

  const useAbbyData = () => {
    const injected = inject<ShallowRef<AbbyProjectData | null> | null>(ABBY_INJECT_KEY, null);
    if (!injected) {
      initGlobalLoader();
      return abbyDataRef;
    }
    return injected;
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
        dataRef.value?.tests[name as unknown as TestName]?.selectedVariant ?? ""
      );
    });

    const notify = () => {
      const variant = selectedVariant.value;
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
    };

    watch(
      selectedVariant,
      (newVariant, oldVariant) => {
        if (newVariant && newVariant !== oldVariant) {
          notify();
        }
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

    const variant = computed(() => {
      const variantVal = selectedVariant.value as TestVariant;
      return lookupObject ? lookupObject[variantVal] : (variantVal as any);
    });

    return {
      variant,
      onAct,
    };
  };

  const useFeatureFlag = (name: FlagName): ComputedRef<boolean> => {
    const dataRef = useAbbyData();
    return computed(() => {
      return dataRef.value?.flags[name]?.value ?? false;
    });
  };

  const useFeatureFlags = () => {
    const dataRef = useAbbyData();
    return computed(() => {
      const flags = dataRef.value?.flags ?? ({} as Record<FlagName, any>);
      return (Object.keys(flags) as Array<FlagName>).map((flagName) => ({
        name: flagName,
        value: flags[flagName].value,
      }));
    });
  };

  const useRemoteConfigVariables = () => {
    const dataRef = useAbbyData();
    return computed(() => {
      const remoteConfig = dataRef.value?.remoteConfig ?? ({} as Record<RemoteConfigName, any>);
      return (Object.keys(remoteConfig) as Array<RemoteConfigName>).map(
        (configName) => ({
          name: configName,
          value: remoteConfig[configName].value,
        })
      );
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
      return dataRef.value?.remoteConfig[remoteConfigName]
        ?.value as RemoteConfigValueStringToType<Config>;
    });
  };

  const getFeatureFlagValue = (name: FlagName) => {
    initGlobalLoader();
    return abby.getFeatureFlag(name);
  };

  const getRemoteConfig = <
    T extends RemoteConfigName,
    Config extends RemoteConfig[T],
  >(
    remoteConfigName: T
  ): RemoteConfigValueStringToType<Config> => {
    initGlobalLoader();
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
    initGlobalLoader();
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
    initGlobalLoader();
    return abby.getVariants(name);
  };

  const updateUserProperties = (
    user: Partial<{
      -readonly [K in keyof User]: Infer<User[K]>;
    }>
  ) => {
    abby.updateUserProperties(user);
  };



  const AbbyProvider = {
    name: "AbbyProvider",
    props: {
      initialData: {
        type: Object,
        default: undefined,
      },
    },
    setup(props: any, { slots }: any) {
      const providerDataRef = shallowRef<AbbyProjectData | null>(null);

      if (props.initialData) {
        providerDataRef.value = abby.init(props.initialData);
      } else {
        providerDataRef.value = abby.getProjectData();
        if (typeof window !== "undefined") {
          abby.loadProjectData().then((data) => {
            if (data) {
              providerDataRef.value = data;
            }
          });
        }
      }

      if (typeof window !== "undefined") {
        abby.subscribe((data) => {
          providerDataRef.value = data;
        });
      }

      provide(ABBY_INJECT_KEY, providerDataRef);

      return () => (slots.default ? slots.default() : null);
    },
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
