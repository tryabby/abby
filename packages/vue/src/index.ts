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
import {
  type ComputedRef,
  type InjectionKey,
  type PropType,
  type Ref,
  computed,
  defineComponent,
  inject,
  onBeforeUnmount,
  onMounted,
  provide,
  shallowRef,
} from "vue";
import {
  FlagStorageService,
  RemoteConfigStorageService,
  TestStorageService,
} from "./StorageService";

type InferValidator<T> = T extends { type: "string" }
  ? T extends { optional: true }
    ? string | null | undefined
    : string
  : T extends { type: "number" }
    ? T extends { optional: true }
      ? number | null | undefined
      : number
    : T extends { type: "boolean" }
      ? T extends { optional: true }
        ? boolean | null | undefined
        : boolean
      : never;

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

  type AbbyProjectData = ReturnType<typeof abby.getProjectData>;
  const AbbyDataKey: InjectionKey<Ref<AbbyProjectData>> = Symbol("AbbyData");

  const useAbbyData = () => {
    const data = inject(AbbyDataKey);
    if (!data) {
      throw new Error(
        "useAbbyData must be used within an AbbyProvider. Wrap a parent component in <AbbyProvider> to fix this error."
      );
    }
    return data;
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
      const data = shallowRef<AbbyProjectData>(
        props.initialData ? abby.init(props.initialData) : abby.getProjectData()
      );
      provide(AbbyDataKey, data);
      let unsubscribe: (() => void) | undefined;

      onMounted(() => {
        if (!props.initialData) {
          abby.loadProjectData().then((loadedData) => {
            if (loadedData) data.value = loadedData;
          });
        }

        unsubscribe = abby.subscribe((newData) => {
          data.value = newData as AbbyProjectData;
        });
      });
      onBeforeUnmount(() => unsubscribe?.());

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
    variant: ComputedRef<ABTestReturnValue<Lookup, TestVariant>>;
    onAct: () => void;
  } => {
    const data = useAbbyData();
    const selectedVariant = computed(() => {
      return (
        data.value.tests[name as unknown as TestName]?.selectedVariant ?? ""
      );
    });

    const variant = computed(() => {
      const currentVariant = selectedVariant.value as TestVariant;
      return lookupObject
        ? lookupObject[currentVariant]
        : (currentVariant as any);
    }) as ComputedRef<ABTestReturnValue<Lookup, TestVariant>>;

    const notify = () => {
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
    };

    onMounted(notify);

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
    const data = useAbbyData();
    return computed(() => data.value.flags[name].value);
  };

  const useRemoteConfig = <
    T extends RemoteConfigName,
    Config extends RemoteConfig[T],
  >(
    remoteConfigName: T
  ): ComputedRef<RemoteConfigValueStringToType<Config>> => {
    const data = useAbbyData();
    return computed(
      () => data.value.remoteConfig[remoteConfigName].value as any
    );
  };

  const useFeatureFlags = () => {
    const data = useAbbyData();
    return computed(() =>
      (Object.keys(data.value.flags) as Array<FlagName>).map((name) => ({
        name,
        value: data.value.flags[name].value,
      }))
    );
  };

  const useRemoteConfigVariables = () => {
    const data = useAbbyData();
    return computed(
      () =>
        (Object.keys(data.value.remoteConfig) as Array<RemoteConfigName>).map(
          (name) => ({
            name,
            value: data.value.remoteConfig[name].value,
          })
        ) as Array<{
          name: RemoteConfigName;
          value: RemoteConfigValueStringToType<RemoteConfig[RemoteConfigName]>;
        }>
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
    K extends keyof Tests,
    TestVariant extends Tests[K]["variants"][number],
    LookupValue,
    const Lookup extends
      | Record<TestVariant, LookupValue>
      | undefined = undefined,
  >(
    name: K,
    lookupObject?: Lookup
  ): ABTestReturnValue<Lookup, TestVariant> => {
    const variant = abby.getTestVariant(name);
    if (lookupObject === undefined) return variant as any;
    return lookupObject[variant as TestVariant] as any;
  };

  const getVariants = <T extends keyof Tests>(name: T) => {
    return abby.getVariants(name);
  };

  const getABResetFunction = <T extends keyof Tests>(name: T) => {
    return () => {
      TestStorageService.remove(config.projectId, name as string);
    };
  };

  const updateUserProperties = (
    user: Partial<{
      -readonly [K in keyof User]: InferValidator<User[K]>;
    }>
  ) => {
    abby.updateUserProperties(user);
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
