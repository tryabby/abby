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
  type InjectionKey,
  computed,
  inject,
  onMounted,
  onUnmounted,
  provide,
  ref,
  type App,
  type ComputedRef,
  type Ref,
} from "vue";
import {
  FlagStorageService,
  RemoteConfigStorageService,
  TestStorageService,
} from "./StorageService";

export type ABTestReturnValue<Lookup, TestVariant extends PropertyKey> =
  Lookup extends undefined
    ? TestVariant
    : Lookup[TestVariant & keyof Lookup];

type AbbyProjectData = ReturnType<Abby<any, any, any, any, any>["getProjectData"]>;

export function createAbby<
  const FlagName extends string,
  const TestName extends string,
  const Tests extends Record<TestName, ABConfig>,
  const RemoteConfig extends Record<RemoteConfigName, RemoteConfigValueString>,
  const RemoteConfigName extends Extract<keyof RemoteConfig, string>,
  const User extends Record<string, ValidatorType> = Record<string, ValidatorType>,
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
  const AbbyDataKey: InjectionKey<Ref<AbbyProjectData | null>> =
    Symbol("abby-data");

  const useAbbyData = () => {
    const data = inject(AbbyDataKey);
    if (!data) {
      throw new Error(
        "useAbbyData must be used within an AbbyProvider. Wrap a parent component in <AbbyProvider> to fix this error."
      );
    }
    return data;
  };

  function useAbby<K extends keyof Tests>(name: K): {
    variant: ComputedRef<Tests[K]["variants"][number]>;
    onAct: () => void;
  };
  function useAbby<
    K extends keyof Tests,
    const Lookup extends Record<Tests[K]["variants"][number], unknown>,
  >(
    name: K,
    lookupObject: Lookup
  ): {
    variant: ComputedRef<Lookup[keyof Lookup]>;
    onAct: () => void;
  };
  function useAbby<K extends keyof Tests>(
    name: K,
    lookupObject?: Record<PropertyKey, unknown>
  ) {
    const data = useAbbyData();
    type TestVariant = Tests[K]["variants"][number];
    const selectedVariant = ref("");

    const syncVariant = () => {
      const fromData =
        data.value?.tests[name as unknown as TestName]?.selectedVariant;
      const fromAbby =
        abby.getProjectData().tests[name as unknown as TestName]
          ?.selectedVariant;
      const next = fromData ?? fromAbby ?? "";
      selectedVariant.value = next;
    };

    onMounted(() => {
      syncVariant();
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

    const variant = computed(() => {
      syncVariant();
      const current = selectedVariant.value;
      if (lookupObject) {
        return lookupObject[current as TestVariant];
      }
      return current as TestVariant;
    });

    return { variant, onAct };
  }

  const useFeatureFlag = (name: FlagName): ComputedRef<boolean> => {
    const data = useAbbyData();
    return computed(() => {
      const fromData = data.value?.flags[name]?.value;
      if (typeof fromData === "boolean") return fromData;
      return Boolean(abby.getFeatureFlag(name));
    });
  };

  const useRemoteConfig = <
    T extends RemoteConfigName,
    Config extends RemoteConfig[T],
  >(
    remoteConfigName: T
  ): ComputedRef<RemoteConfigValueStringToType<Config>> => {
    const data = useAbbyData();
    return computed(() => {
      const fromData = data.value?.remoteConfig[remoteConfigName]?.value;
      if (fromData !== undefined) {
        return fromData as RemoteConfigValueStringToType<Config>;
      }
      return abby.getRemoteConfig(remoteConfigName);
    });
  };

  const AbbyProvider = {
    name: "AbbyProvider",
    props: {
      initialData: {
        type: Object as () => AbbyDataResponse | undefined,
        required: false,
      },
    },
    setup(
      props: { initialData?: AbbyDataResponse },
      { slots }: { slots: { default?: () => unknown } }
    ) {
      const data = ref<AbbyProjectData | null>(
        props.initialData
          ? abby.init(props.initialData)
          : abby.getProjectData()
      );
      provide(AbbyDataKey, data);

      onMounted(() => {
        if (props.initialData) return;
        abby.loadProjectData().then((loaded) => {
          if (!loaded) return;
          data.value = loaded;
        });
      });

      const unsubscribe = abby.subscribe((next) => {
        data.value = next;
      });
      onUnmounted(unsubscribe);

      return () => slots.default?.();
    },
  };

  const install = (app: App, options?: { initialData?: AbbyDataResponse }) => {
    const data = ref<AbbyProjectData | null>(
      options?.initialData
        ? abby.init(options.initialData)
        : abby.getProjectData()
    );
    app.provide(AbbyDataKey, data);
    if (!options?.initialData && typeof window !== "undefined") {
      abby.loadProjectData().then((loaded) => {
        if (!loaded) return;
        data.value = loaded;
      });
    }
    abby.subscribe((next) => {
      data.value = next;
    });
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
    const Lookup extends Record<PropertyKey, unknown> | undefined = undefined,
  >(
    testName: TestName,
    lookupObject?: Lookup
  ): ABTestReturnValue<Lookup, Tests[TestName]["variants"][number]> => {
    type TestVariant = Tests[TestName]["variants"][number];
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

  return {
    useAbby,
    useFeatureFlag,
    useRemoteConfig,
    AbbyProvider,
    install,
    getFeatureFlagValue,
    getRemoteConfig,
    getABTestValue,
    __abby__: abby,
    getABResetFunction,
    getVariants,
    updateUserProperties,
  };
}
