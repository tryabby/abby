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
  defineConfig,
} from "@tryabby/core";
import {
  computed,
  defineComponent,
  inject,
  onMounted,
  onUnmounted,
  provide,
  ref,
  watchEffect,
  type ComputedRef,
  type InjectionKey,
  type PropType,
  type Ref,
} from "vue";

export { type ABConfig, type AbbyConfig, defineConfig };

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
  const memoryStore = new Map<string, string>();
  const storageAdapter = {
    get: (key: string) => memoryStore.get(`${abbyConfig.projectId}:${key}`) ?? null,
    set: (key: string, value: any) => {
      memoryStore.set(`${abbyConfig.projectId}:${key}`, String(value));
    },
  };

  const abby = new Abby<
    FlagName,
    TestName,
    Tests,
    RemoteConfig,
    RemoteConfigName,
    string[],
    User
  >(abbyConfig, storageAdapter, storageAdapter, storageAdapter);

  type AbbyProjectData = ReturnType<typeof abby.getProjectData>;

  // Per-factory injection key so nested providers from separate createAbby instances never collide
  const abbyInjectionKey: InjectionKey<Ref<AbbyProjectData>> = Symbol("AbbyInjectionKey");

  const useAbbyData = (): Ref<AbbyProjectData> => {
    const injected = inject(abbyInjectionKey, null);
    if (!injected) {
      throw new Error(
        "useAbbyData must be used within an AbbyProvider. Wrap a parent component in <AbbyProvider> to fix this error."
      );
    }
    return injected;
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
        abby.setResponse(props.initialData);
      }
      const projectData = ref<AbbyProjectData>(abby.getProjectData()) as Ref<AbbyProjectData>;

      // Subscribe synchronously during setup before child component setup executes
      const unsubscribe = abby.subscribe(() => {
        projectData.value = abby.getProjectData();
      });

      provide(abbyInjectionKey, projectData);

      onMounted(() => {
        if (!props.initialData) {
          void abby.load();
        }
      });

      onUnmounted(() => {
        if (typeof unsubscribe === "function") {
          unsubscribe();
        }
      });

      return () => (slots.default ? slots.default() : null);
    },
  });

  const useAbby = <
    K extends keyof Tests,
    TestVariant extends Tests[K]["variants"][number],
    LookupValue = unknown,
    const Lookup extends Record<TestVariant, LookupValue> | undefined = undefined,
  >(
    name: K,
    lookupObject?: Lookup
  ): {
    variant: ComputedRef<ABTestReturnValue<Lookup, TestVariant>>;
    onAct: () => void;
  } => {
    const projectData = useAbbyData();

    const selectedVariant = computed<TestVariant>(() => {
      const snap = projectData.value.tests?.[name as unknown as TestName]?.selectedVariant;
      if (snap !== undefined) {
        return snap as TestVariant;
      }
      return abby.getTestVariant(name) as TestVariant;
    });

    const variant = computed<ABTestReturnValue<Lookup, TestVariant>>(() => {
      const raw = selectedVariant.value;
      if (lookupObject === undefined) {
        return raw as unknown as ABTestReturnValue<Lookup, TestVariant>;
      }
      return lookupObject[raw] as unknown as ABTestReturnValue<Lookup, TestVariant>;
    });

    watchEffect(() => {
      const currentVariant = selectedVariant.value;
      const testId = projectData.value.tests?.[name as unknown as TestName]?.id;
      if (!name || !currentVariant || !testId) return;
      void HttpService.sendData({
        url: abbyConfig.apiUrl,
        type: AbbyEventType.PING,
        data: {
          projectId: abbyConfig.projectId,
          selectedVariant: currentVariant,
          testId,
        },
      });
    });

    const onAct = () => {
      const currentVariant = selectedVariant.value;
      const testId = projectData.value.tests?.[name as unknown as TestName]?.id;
      if (!currentVariant || !testId) return;
      void HttpService.sendData({
        url: abbyConfig.apiUrl,
        type: AbbyEventType.ACT,
        data: {
          projectId: abbyConfig.projectId,
          selectedVariant: currentVariant,
          testId,
        },
      });
    };

    return { variant, onAct };
  };

  const useFeatureFlag = <K extends FlagName>(flagName: K): ComputedRef<boolean> => {
    const projectData = useAbbyData();
    return computed<boolean>(() => {
      const val = projectData.value.flags?.[flagName];
      if (typeof val === "boolean") return val;
      return Boolean(abby.getFeatureFlag(flagName));
    });
  };

  const useRemoteConfig = <
    T extends RemoteConfigName,
    Config extends RemoteConfig[T],
  >(
    configKey: T
  ): ComputedRef<RemoteConfigValueStringToType<Config>> => {
    const projectData = useAbbyData();
    return computed<RemoteConfigValueStringToType<Config>>(() => {
      const entry = projectData.value.remoteConfig?.[configKey];
      if (entry && "value" in entry) {
        return entry.value as RemoteConfigValueStringToType<Config>;
      }
      return abby.getRemoteConfig(configKey);
    });
  };

  const getFeatureFlagValue = (name: FlagName): boolean => abby.getFeatureFlag(name);

  const getRemoteConfig = <
    T extends RemoteConfigName,
    Config extends RemoteConfig[T],
  >(
    remoteConfigName: T
  ): RemoteConfigValueStringToType<Config> => abby.getRemoteConfig(remoteConfigName);

  const getABTestValue = <
    K extends keyof Tests,
    TestVariant extends Tests[K]["variants"][number],
    LookupValue = unknown,
    const Lookup extends Record<TestVariant, LookupValue> | undefined = undefined,
  >(
    testName: K,
    lookupObject?: Lookup
  ): ABTestReturnValue<Lookup, TestVariant> => {
    const v = abby.getTestVariant(testName) as TestVariant;
    if (lookupObject === undefined) {
      return v as unknown as ABTestReturnValue<Lookup, TestVariant>;
    }
    return lookupObject[v] as unknown as ABTestReturnValue<Lookup, TestVariant>;
  };

  return {
    AbbyProvider,
    useAbby,
    useFeatureFlag,
    useRemoteConfig,
    getFeatureFlagValue,
    getRemoteConfig,
    getABTestValue,
    __abby__: abby,
  };
}
