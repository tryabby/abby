import {
  type ABConfig,
  Abby,
  type AbbyConfig,
  type RemoteConfigValueString,
  type RemoteConfigValueStringToType,
  type ValidatorType,
} from "@tryabby/core";
import {
  type AbbyDataResponse,
  AbbyEventType,
  HttpService,
} from "@tryabby/core";
import type { Infer } from "@tryabby/core/validation";
import {
  type InjectionKey,
  type Ref,
  computed,
  defineComponent,
  inject,
  onMounted,
  onUnmounted,
  provide,
  ref,
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
    config,
    {
      get: (key: string) => {
        if (typeof window === "undefined") return null;
        return TestStorageService.get(config.projectId, key);
      },
      set: (key: string, value: string, options) => {
        if (typeof window === "undefined" || config.cookies?.disableByDefault) {
          return;
        }
        TestStorageService.set(config.projectId, key, value, options);
      },
    },
    {
      get: (key: string) => {
        if (typeof window === "undefined") return null;
        return FlagStorageService.get(config.projectId, key);
      },
      set: (key: string, value: string) => {
        if (typeof window === "undefined" || config.cookies?.disableByDefault) {
          return;
        }
        FlagStorageService.set(config.projectId, key, value);
      },
    },
    {
      get: (key: string) => {
        if (typeof window === "undefined") return null;
        return RemoteConfigStorageService.get(config.projectId, key);
      },
      set: (key: string, value: string) => {
        if (typeof window === "undefined" || config.cookies?.disableByDefault) {
          return;
        }
        RemoteConfigStorageService.set(config.projectId, key, value);
      },
    }
  );

  type AbbyProjectData = ReturnType<typeof abby.getProjectData>;
  type AbbyProjectDataRef = Ref<AbbyProjectData>;

  const AbbyDataKey = Symbol("AbbyData") as InjectionKey<AbbyProjectDataRef>;

  const getInjectedData = () => {
    const data = inject(AbbyDataKey);

    if (!data) {
      throw new Error(
        "Abby composables must be used within an AbbyProvider. Add <AbbyProvider> above this component to fix this error."
      );
    }

    return data;
  };

  const createDataRef = (initialData?: AbbyDataResponse) => {
    return ref(
      initialData ? abby.init(initialData) : abby.getProjectData()
    ) as AbbyProjectDataRef;
  };

  const AbbyProvider = defineComponent({
    name: "AbbyProvider",
    props: {
      initialData: {
        type: Object as () => AbbyDataResponse | undefined,
        required: false,
      },
    },
    setup(props, { slots }) {
      const data = createDataRef(props.initialData);
      provide(AbbyDataKey, data);

      onMounted(() => {
        let isMounted = true;

        const unsubscribe = abby.subscribe((newData) => {
          data.value = newData as AbbyProjectData;
        });

        if (!props.initialData) {
          abby.loadProjectData().then((newData) => {
            if (!isMounted || !newData) return;
            data.value = newData as AbbyProjectData;
          });
        }

        onUnmounted(() => {
          isMounted = false;
          unsubscribe();
        });
      });

      return () => slots.default?.();
    },
  });

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
    variant: Ref<ABTestReturnValue<Lookup, TestVariant>>;
    onAct: () => void;
  } => {
    const data = getInjectedData();

    const variant = computed(() => {
      const selectedVariant =
        data.value.tests[name as unknown as TestName]?.selectedVariant ?? "";

      return lookupObject
        ? lookupObject[selectedVariant as TestVariant]
        : (selectedVariant as any);
    });

    onMounted(() => {
      const selectedVariant =
        data.value.tests[name as unknown as TestName]?.selectedVariant ?? "";

      if (!selectedVariant) return;

      HttpService.sendData({
        url: config.apiUrl,
        type: AbbyEventType.PING,
        data: {
          projectId: config.projectId,
          selectedVariant,
          testName: name as string,
        },
      });
    });

    const onAct = () => {
      const selectedVariant =
        data.value.tests[name as unknown as TestName]?.selectedVariant ?? "";

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
      variant: variant as Ref<ABTestReturnValue<Lookup, TestVariant>>,
      onAct,
    };
  };

  const useFeatureFlag = (name: FlagName): Ref<boolean> => {
    const data = getInjectedData();
    return computed(() => data.value.flags[name].value);
  };

  const useFeatureFlags = () => {
    const data = getInjectedData();
    return computed(() =>
      (Object.keys(data.value.flags) as Array<FlagName>).map((flagName) => ({
        name: flagName,
        value: data.value.flags[flagName].value,
      }))
    );
  };

  const getFeatureFlagValue = (name: FlagName) => {
    return abby.getFeatureFlag(name);
  };

  const useRemoteConfig = <
    T extends RemoteConfigName,
    Config extends RemoteConfig[T],
  >(
    remoteConfigName: T
  ): Ref<RemoteConfigValueStringToType<Config>> => {
    const data = getInjectedData();
    return computed(
      () =>
        data.value.remoteConfig[remoteConfigName]
          .value as RemoteConfigValueStringToType<Config>
    ) as Ref<RemoteConfigValueStringToType<Config>>;
  };

  const useRemoteConfigVariables = () => {
    const data = getInjectedData();
    return computed(
      () =>
        (Object.keys(data.value.remoteConfig) as Array<RemoteConfigName>).map(
          (configName) => ({
            name: configName,
            value: data.value.remoteConfig[configName]
              .value as RemoteConfigValueStringToType<
              RemoteConfig[RemoteConfigName]
            >,
          })
        ) as Array<{
          name: RemoteConfigName;
          value: RemoteConfigValueStringToType<RemoteConfig[RemoteConfigName]>;
        }>
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
    CurrentTestName extends keyof Tests,
    TestVariant extends Tests[CurrentTestName]["variants"][number],
    LookupValue,
    const Lookup extends
      | Record<TestVariant, LookupValue>
      | undefined = undefined,
  >(
    testName: CurrentTestName,
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

  return {
    AbbyProvider,
    useAbby,
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
