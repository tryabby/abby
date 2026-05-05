import {
  type ABConfig,
  Abby,
  type AbbyConfig,
  AbbyEventType,
  type AbbyDataResponse,
  HttpService,
  type RemoteConfigValueString,
  type RemoteConfigValueStringToType,
  type ValidatorType,
} from "@tryabby/core";
import type { Infer } from "@tryabby/core/validation";
import {
  computed,
  defineComponent,
  h,
  hasInjectionContext,
  inject,
  onMounted,
  onUnmounted,
  provide,
  ref,
  watch,
  type ComputedRef,
  type InjectionKey,
  type PropType,
  type Ref,
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
        if (typeof window === "undefined" || config.cookies?.disableByDefault)
          return null;
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
        if (typeof window === "undefined" || config.cookies?.disableByDefault)
          return null;
        return FlagStorageService.get(config.projectId, key);
      },
      set: (key: string, value: string) => {
        if (typeof window === "undefined" || config.cookies?.disableByDefault)
          return;
        FlagStorageService.set(config.projectId, key, value);
      },
    },
    {
      get: (key: string) => {
        if (typeof window === "undefined" || config.cookies?.disableByDefault)
          return null;
        return RemoteConfigStorageService.get(config.projectId, key);
      },
      set: (key: string, value: string) => {
        if (typeof window === "undefined" || config.cookies?.disableByDefault)
          return;
        RemoteConfigStorageService.set(config.projectId, key, value);
      },
    }
  );

  type AbbyProjectData = ReturnType<typeof abby.getProjectData>;

  const abbyData = ref(abby.getProjectData()) as Ref<AbbyProjectData>;
  const AbbyDataKey: InjectionKey<Ref<AbbyProjectData>> = Symbol("AbbyData");

  const useAbbyData = () =>
    hasInjectionContext() ? inject(AbbyDataKey, abbyData) : abbyData;

  const notify = <N extends keyof Tests>(
    name: N,
    selectedVariant: string
  ) => {
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
    const selectedVariant = computed(
      () => {
        data.value;
        return abby.getTestVariant(name) as TestVariant;
      }
    );

    let lastSentVariant: string | null = null;
    watch(
      selectedVariant,
      (currentVariant) => {
        if (!currentVariant || currentVariant === lastSentVariant) return;
        lastSentVariant = currentVariant;
        notify(name, currentVariant);
      },
      { immediate: !hasInjectionContext() }
    );

    const variant = computed(() => {
      const currentVariant = selectedVariant.value;
      if (lookupObject) {
        return lookupObject[currentVariant];
      }
      return currentVariant;
    }) as ComputedRef<ABTestReturnValue<Lookup, TestVariant>>;

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
    return computed(() => {
      data.value;
      return abby.getFeatureFlag(name);
    });
  };

  const getFeatureFlagValue = (name: FlagName) => abby.getFeatureFlag(name);

  const useRemoteConfig = <
    T extends RemoteConfigName,
    Config extends RemoteConfig[T],
  >(
    remoteConfigName: T
  ): ComputedRef<RemoteConfigValueStringToType<Config>> => {
    const data = useAbbyData();
    return computed(
      () => {
        data.value;
        return abby.getRemoteConfig(remoteConfigName);
      }
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
    const variant = abby.getTestVariant(testName);
    if (lookupObject === undefined) {
      return variant as any;
    }
    return lookupObject[variant as TestVariant] as any;
  };

  const getABResetFunction = <K extends keyof Tests>(name: K) => {
    return () => {
      TestStorageService.remove(config.projectId, name as string);
    };
  };

  const getVariants = <K extends keyof Tests>(name: K) => {
    return abby.getVariants(name);
  };

  const useFeatureFlags = () => {
    const data = useAbbyData();
    return computed(() => {
      data.value;
      return abby.getFeatureFlags();
    });
  };

  const useRemoteConfigVariables = () => {
    const data = useAbbyData();
    return computed(
      () => {
        data.value;
        return abby.getRemoteConfigVariables();
      }
    );
  };

  const updateUserProperties = (
    user: Partial<{
      -readonly [K in keyof User]: Infer<User[K]>;
    }>
  ) => {
    abby.updateUserProperties(user);
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
        abbyData.value = abby.init(props.initialData) as AbbyProjectData;
      }

      provide(AbbyDataKey, abbyData);

      let unsubscribe: (() => void) | undefined;

      onMounted(async () => {
        if (!props.initialData) {
          const data = await abby.loadProjectData();
          if (data) abbyData.value = data as AbbyProjectData;
        }

        unsubscribe = abby.subscribe((newData) => {
          abbyData.value = newData as AbbyProjectData;
        });
      });

      onUnmounted(() => {
        unsubscribe?.();
      });

      return () => slots.default?.();
    },
  });

  const withDevtools = (
    factory: {
      create: (props: Record<string, unknown>) => () => void;
    },
    props: Record<string, unknown> & { dangerouslyForceShow?: boolean } = {}
  ) =>
    defineComponent({
      name: "AbbyDevtools",
      setup() {
        let destroy: (() => void) | undefined;
        onMounted(() => {
          if (
            !props.dangerouslyForceShow &&
            process.env.NODE_ENV !== "development"
          ) {
            return;
          }
          destroy = factory.create({ ...props, abby });
        });
        onUnmounted(() => destroy?.());
        return () => h("span", { style: "display: none;" });
      },
    });

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
    withDevtools,
  };
}
