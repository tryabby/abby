import {
  type ABConfig,
  Abby,
  type AbbyConfig,
  type RemoteConfigValueString,
  type RemoteConfigValueStringToType,
  type ValidatorType,
} from "@tryabby/core";
import { HttpService } from "@tryabby/core";
import { type AbbyDataResponse, AbbyEventType } from "@tryabby/core";
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
  props: Omit<AbbyDevtoolProps, "abby"> & {
    dangerouslyForceShow?: boolean;
  }
) => ReturnType<typeof defineComponent>;

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
  // we need to return the config as a const so that the types are narrowed
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

  interface AbbyContextValue {
    data: Ref<AbbyProjectData | null>;
  }

  const AbbySymbol: InjectionKey<AbbyContextValue> = Symbol("AbbyVueContext");

  // Module-level reactive store so composables work with AbbyPlugin / outside a
  // local provider (mirrors how Svelte derives from the Abby store).
  const globalData = shallowRef<AbbyProjectData>(abby.getProjectData());
  abby.subscribe((newData) => {
    globalData.value = newData;
  });

  const useAbbyData = (): Ref<AbbyProjectData | null> => {
    const instance = getCurrentInstance();
    if (instance) {
      const injected = inject(AbbySymbol, null);
      if (injected) {
        return injected.data;
      }
    }
    return globalData;
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
      const data = shallowRef<AbbyProjectData | null>(
        props.initialData ? abby.init(props.initialData) : abby.getProjectData()
      );

      let cancelled = false;
      let unsubscribe: (() => void) | null = null;

      onMounted(() => {
        if (!props.initialData) {
          abby.loadProjectData().then((projectData) => {
            if (!cancelled && projectData) {
              data.value = projectData;
            }
          });
        }

        unsubscribe = abby.subscribe((newData) => {
          if (!cancelled) {
            data.value = newData;
          }
        });
      });

      onUnmounted(() => {
        cancelled = true;
        unsubscribe?.();
      });

      provide(AbbySymbol, { data });

      return () => slots.default?.() ?? null;
    },
  });

  const AbbyPlugin: Plugin = {
    install(app: App, options?: { initialData?: AbbyDataResponse }) {
      const data = shallowRef<AbbyProjectData | null>(
        options?.initialData
          ? abby.init(options.initialData)
          : abby.getProjectData()
      );

      if (!options?.initialData) {
        abby.loadProjectData().then((projectData) => {
          if (projectData) {
            data.value = projectData;
          }
        });
      }

      abby.subscribe((newData) => {
        data.value = newData;
      });

      app.provide(AbbySymbol, { data });
      app.component("AbbyProvider", AbbyProvider);
    },
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

    // Start empty to avoid SSR mismatches (same approach as React), then
    // hydrate from project data once we are on the client.
    const selectedVariant = shallowRef("");

    const resolveVariant = () => {
      const fromData =
        projectData.value?.tests?.[name as unknown as TestName]
          ?.selectedVariant;
      if (fromData !== undefined) {
        selectedVariant.value = fromData;
        return;
      }
      selectedVariant.value =
        abby.getProjectData().tests[name as unknown as TestName]
          ?.selectedVariant ?? "";
    };

    if (getCurrentInstance()) {
      onMounted(() => {
        resolveVariant();
      });
      watch(
        () =>
          projectData.value?.tests?.[name as unknown as TestName]
            ?.selectedVariant,
        (newVariant) => {
          if (newVariant !== undefined) {
            selectedVariant.value = newVariant;
          }
        }
      );
      watch(selectedVariant, (variantVal) => {
        if (!name || !variantVal) return;
        HttpService.sendData({
          url: config.apiUrl,
          type: AbbyEventType.PING,
          data: {
            projectId: config.projectId,
            selectedVariant: variantVal,
            testName: name as string,
          },
        });
      });
    } else {
      resolveVariant();
      if (name && selectedVariant.value) {
        HttpService.sendData({
          url: config.apiUrl,
          type: AbbyEventType.PING,
          data: {
            projectId: config.projectId,
            selectedVariant: selectedVariant.value,
            testName: name as string,
          },
        });
      }
    }

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

    const variant = computed<ABTestReturnValue<Lookup, TestVariant>>(() => {
      if (lookupObject === undefined) {
        return selectedVariant.value as any;
      }
      return (lookupObject as Record<string, LookupValue>)[
        selectedVariant.value
      ] as any;
    });

    return {
      /**
       * Call this when something that uses the selected variant has been rendered.
       * It sends an ACT event for the currently selected variant.
       */
      onAct,
      variant,
    };
  };

  const useFeatureFlag = (name: FlagName): ComputedRef<boolean> => {
    const projectData = useAbbyData();
    return computed(() => {
      const flag = projectData.value?.flags?.[name];
      if (flag) {
        return flag.value;
      }
      return abby.getFeatureFlag(name);
    });
  };

  /**
   * Returns an Array of all flags with their name and value
   */
  const useFeatureFlags = (): ComputedRef<
    Array<{ name: FlagName; value: boolean }>
  > => {
    const projectData = useAbbyData();
    return computed(() => {
      const flags = projectData.value?.flags;
      if (!flags) return [];
      return (Object.keys(flags) as Array<FlagName>).map((flagName) => ({
        name: flagName,
        value: flags[flagName].value,
      }));
    });
  };

  /**
   * Returns an Array of all remote config variables with their name and value
   */
  const useRemoteConfigVariables = (): ComputedRef<
    Array<{
      name: RemoteConfigName;
      value: RemoteConfigValueStringToType<RemoteConfig[RemoteConfigName]>;
    }>
  > => {
    const projectData = useAbbyData();
    return computed(() => {
      const remoteConfig = projectData.value?.remoteConfig;
      if (!remoteConfig) return [];
      return (Object.keys(remoteConfig) as Array<RemoteConfigName>).map(
        (configName) => ({
          name: configName,
          value: remoteConfig[configName].value,
        })
      ) as Array<{
        name: RemoteConfigName;
        value: RemoteConfigValueStringToType<RemoteConfig[RemoteConfigName]>;
      }>;
    });
  };

  const getFeatureFlagValue = (name: FlagName) => {
    return abby.getFeatureFlag(name);
  };

  const useRemoteConfig = <
    T extends RemoteConfigName,
    Config extends RemoteConfig[T],
  >(
    remoteConfigName: T
  ): ComputedRef<RemoteConfigValueStringToType<Config>> => {
    const projectData = useAbbyData();
    return computed(() => {
      const entry = projectData.value?.remoteConfig?.[remoteConfigName];
      if (entry) {
        return entry.value as RemoteConfigValueStringToType<Config>;
      }
      return abby.getRemoteConfig(remoteConfigName);
    });
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

  /**
   * Simple helper function create a function that resets an AB test
   * @param name the name of the test
   * @returns A function that can be called to reset the test
   */
  const getABResetFunction = <T extends keyof Tests>(name: T) => {
    return () => {
      TestStorageService.remove(config.projectId, name as string);
    };
  };

  /**
   * Simple helper function to get a list of all variants for a given test
   * @param name the name of the test
   * @returns an array of all variants
   */
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
