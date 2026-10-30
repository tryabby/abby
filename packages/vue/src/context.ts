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
  props?: Omit<AbbyDevtoolProps, "abby"> & {
    dangerouslyForceShow?: boolean;
  }
) => unknown;

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
      set: (
        key: string,
        value: string,
        options?: { expiresInDays?: number }
      ) => {
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
      set: (key: string, value: string) => {
        if (typeof window === "undefined") return;
        FlagStorageService.set(abbyConfig.projectId, key, value);
      },
    },
    {
      get: (key: string) => {
        if (typeof window === "undefined") return null;
        return RemoteConfigStorageService.get(abbyConfig.projectId, key);
      },
      set: (key: string, value: string) => {
        if (typeof window === "undefined") return;
        RemoteConfigStorageService.set(abbyConfig.projectId, key, value);
      },
    }
  );

  type AbbyProjectData = ReturnType<typeof abby.getProjectData>;

  const AbbyDataKey: InjectionKey<Ref<AbbyProjectData>> = Symbol("AbbyData");
  const AbbyInstanceKey: InjectionKey<typeof abby> = Symbol("AbbyInstance");

  const defaultData = shallowRef<AbbyProjectData>(abby.getProjectData());
  if (typeof window !== "undefined") {
    abby.subscribe((newData) => {
      defaultData.value = newData;
    });
  }

  const useAbbyData = (): Ref<AbbyProjectData> => {
    const instance = getCurrentInstance();
    if (!instance) {
      return defaultData;
    }

    const data = inject<Ref<AbbyProjectData>>(AbbyDataKey);

    if (!data) {
      throw new Error(
        "useAbbyData must be used within an AbbyProvider. Wrap a parent component in <AbbyProvider> to fix this error."
      );
    }

    return data;
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

    // Start with empty string to avoid SSR hydration mismatches
    const selectedVariant = ref<string>("");

    const updateVariant = () => {
      const variantFromTests =
        data.value.tests[name as unknown as TestName]?.selectedVariant;
      if (variantFromTests && variantFromTests !== "undefined") {
        selectedVariant.value = variantFromTests;
        return;
      }

      const projectData = abby.getProjectData();
      const variantFromProject =
        projectData.tests[name as unknown as TestName]?.selectedVariant;

      if (variantFromProject && variantFromProject !== "undefined") {
        selectedVariant.value = variantFromProject;
      }
    };

    if (getCurrentInstance()) {
      onMounted(() => {
        updateVariant();
      });
    } else {
      updateVariant();
    }

    watch(
      () => data.value.tests[name as unknown as TestName]?.selectedVariant,
      (newVariant) => {
        if (
          newVariant !== undefined &&
          newVariant !== "" &&
          newVariant !== "undefined"
        ) {
          selectedVariant.value = newVariant;
        }
      }
    );

    watch(
      selectedVariant,
      (newVariant) => {
        if (!name || !newVariant || newVariant === "undefined") return;
        HttpService.sendData({
          url: config.apiUrl,
          type: AbbyEventType.PING,
          data: {
            projectId: config.projectId,
            selectedVariant: newVariant,
            testName: name as string,
          },
        });
      },
      { immediate: true }
    );

    const onAct = () => {
      const current = selectedVariant.value;
      if (!current || current === "undefined") return;

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
      const v = selectedVariant.value;
      if (!v || v === "undefined") {
        return (lookupObject ? undefined : "") as unknown as ABTestReturnValue<
          Lookup,
          TestVariant
        >;
      }

      return (lookupObject
        ? lookupObject[v as TestVariant]
        : v) as unknown as ABTestReturnValue<Lookup, TestVariant>;
    });

    Object.defineProperty(variant, "valueOf", {
      value: () => variant.value,
      configurable: true,
    });
    Object.defineProperty(variant, "toString", {
      value: () => String(variant.value),
      configurable: true,
    });

    return {
      variant,
      onAct,
    };
  };

  const useFeatureFlag = (name: FlagName): ComputedRef<boolean> => {
    const data = useAbbyData();
    const result = computed<boolean>(() => {
      return data.value.flags[name]?.value ?? false;
    });

    Object.defineProperty(result, "valueOf", {
      value: () => result.value,
      configurable: true,
    });
    Object.defineProperty(result, "toString", {
      value: () => String(result.value),
      configurable: true,
    });

    return result;
  };

  const useFeatureFlags = (): ComputedRef<
    Array<{ name: FlagName; value: boolean }>
  > => {
    const data = useAbbyData();
    return computed(() =>
      (Object.keys(data.value.flags) as Array<FlagName>).map((flagName) => ({
        name: flagName,
        value: data.value.flags[flagName].value,
      }))
    );
  };

  const useRemoteConfig = <
    T extends RemoteConfigName,
    Config extends RemoteConfig[T],
  >(
    remoteConfigName: T
  ): ComputedRef<RemoteConfigValueStringToType<Config>> => {
    const data = useAbbyData();
    const result = computed<RemoteConfigValueStringToType<Config>>(() => {
      return data.value.remoteConfig[remoteConfigName]
        ?.value as RemoteConfigValueStringToType<Config>;
    });

    Object.defineProperty(result, "valueOf", {
      value: () => result.value,
      configurable: true,
    });
    Object.defineProperty(result, "toString", {
      value: () => String(result.value),
      configurable: true,
    });

    return result;
  };

  const useRemoteConfigVariables = (): ComputedRef<
    Array<{
      name: RemoteConfigName;
      value: RemoteConfigValueStringToType<RemoteConfig[RemoteConfigName]>;
    }>
  > => {
    const data = useAbbyData();
    return computed(
      () =>
        (Object.keys(data.value.remoteConfig) as Array<RemoteConfigName>).map(
          (configName) => ({
            name: configName,
            value: data.value.remoteConfig[configName].value,
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
        default: undefined,
      },
    },
    setup(props, { slots }) {
      const data = shallowRef<AbbyProjectData>(
        props.initialData ? abby.init(props.initialData) : abby.getProjectData()
      );

      onMounted(() => {
        if (!props.initialData) {
          abby.loadProjectData().then((projectData) => {
            if (projectData) {
              data.value = projectData;
            }
          });
        }
      });

      if (typeof window !== "undefined") {
        const unsubscribe = abby.subscribe((newData) => {
          data.value = newData;
        });

        onUnmounted(() => {
          unsubscribe();
        });
      }

      provide(AbbyDataKey, data);
      provide(AbbyInstanceKey, abby);

      return () => (slots.default ? slots.default() : null);
    },
  });

  const AbbyPlugin: Plugin = {
    install(app: App, options?: { initialData?: AbbyDataResponse }) {
      const initialData = options?.initialData;
      const data = shallowRef<AbbyProjectData>(
        initialData ? abby.init(initialData) : abby.getProjectData()
      );

      if (!initialData && typeof window !== "undefined") {
        abby.loadProjectData().then((projectData) => {
          if (projectData) {
            data.value = projectData;
          }
        });
      }

      if (typeof window !== "undefined") {
        abby.subscribe((newData) => {
          data.value = newData;
        });
      }

      app.provide(AbbyDataKey, data);
      app.provide(AbbyInstanceKey, abby);
      app.component("AbbyProvider", AbbyProvider);
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
      return variant as unknown as ABTestReturnValue<Lookup, TestVariant>;
    }

    return lookupObject[variant as TestVariant] as unknown as ABTestReturnValue<
      Lookup,
      TestVariant
    >;
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
