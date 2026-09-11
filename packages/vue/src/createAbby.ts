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

/**
 * Initializes Abby for Vue 3 applications.
 *
 * @param abbyConfig - Configuration options for Abby including project credentials, environments, A/B tests, feature flags, and remote config schemas.
 * @returns An object containing Vue components (`AbbyProvider`), plugins (`AbbyPlugin`), reactive composables (`useAbby`, `useFeatureFlag`, `useRemoteConfig`), synchronous getters, and lifecycle reset functions.
 *
 * @example
 * ```ts
 * const { AbbyProvider, useAbby, useFeatureFlag } = createAbby({
 *   projectId: "my-project-id",
 *   currentEnvironment: "production",
 *   tests: { heroTest: { variants: ["control", "variantB"] } },
 * });
 * ```
 */
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
    abby: typeof abby;
  }

  const AbbySymbol: InjectionKey<AbbyContextValue> = Symbol("AbbyVueContext");

  // Fallback global reactive store for when components are not wrapped in Provider
  const globalData = shallowRef<AbbyProjectData>(abby.getProjectData());
  abby.subscribe((newData) => {
    globalData.value = newData;
  });

  const getReactiveData = (): Ref<AbbyProjectData | null> => {
    const context = getCurrentInstance() ? inject(AbbySymbol, null) : null;
    return context ? context.data : globalData;
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

      let unsubscribe: (() => void) | null = null;

      onMounted(() => {
        if (!props.initialData) {
          abby.loadProjectData().then((projectData) => {
            if (projectData) {
              data.value = projectData;
            }
          });
        }
        unsubscribe = abby.subscribe((newData) => {
          data.value = newData;
        });
      });

      onUnmounted(() => {
        if (unsubscribe) {
          unsubscribe();
        }
      });

      provide(AbbySymbol, {
        data,
        abby,
      });

      return () => (slots.default ? slots.default() : null);
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

      app.provide(AbbySymbol, {
        data,
        abby,
      });

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
    const reactiveData = getReactiveData();

    const selectedVariant = computed<string>(() => {
      const currentData = reactiveData.value;
      if (currentData?.tests?.[name as unknown as TestName]) {
        return (
          currentData.tests[name as unknown as TestName]?.selectedVariant ?? ""
        );
      }
      return abby.getTestVariant(name as unknown as TestName) ?? "";
    });

    const sendPing = (variantVal: string) => {
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
    };

    if (getCurrentInstance()) {
      onMounted(() => {
        sendPing(selectedVariant.value);
      });
    } else {
      sendPing(selectedVariant.value);
    }

    const onAct = () => {
      const currentVariant = selectedVariant.value;
      if (!currentVariant) return;

      HttpService.sendData({
        url: config.apiUrl,
        type: AbbyEventType.ACT,
        data: {
          projectId: config.projectId,
          selectedVariant: currentVariant,
          testName: name as string,
        },
      });
    };

    const variant = computed<ABTestReturnValue<Lookup, TestVariant>>(() => {
      const val = selectedVariant.value;
      if (lookupObject === undefined) {
        return val as any;
      }
      return (lookupObject as any)[val];
    });

    return {
      variant,
      onAct,
    };
  };

  const useFeatureFlag = (name: FlagName): ComputedRef<boolean> => {
    const reactiveData = getReactiveData();
    return computed<boolean>(() => {
      const currentData = reactiveData.value;
      if (currentData?.flags?.[name]) {
        return currentData.flags[name].value;
      }
      try {
        return abby.getFeatureFlag(name);
      } catch {
        return false;
      }
    });
  };

  const useFeatureFlags = (): ComputedRef<
    Array<{ name: FlagName; value: boolean }>
  > => {
    const reactiveData = getReactiveData();
    return computed(() => {
      const currentData = reactiveData.value;
      if (currentData?.flags) {
        return (Object.keys(currentData.flags) as Array<FlagName>).map(
          (flagName) => ({
            name: flagName,
            value: currentData.flags[flagName].value,
          })
        );
      }
      return [];
    });
  };

  const useRemoteConfig = <
    T extends RemoteConfigName,
    Config extends RemoteConfig[T],
  >(
    remoteConfigName: T
  ): ComputedRef<RemoteConfigValueStringToType<Config>> => {
    const reactiveData = getReactiveData();
    return computed(() => {
      const currentData = reactiveData.value;
      if (currentData?.remoteConfig?.[remoteConfigName]) {
        return currentData.remoteConfig[remoteConfigName]
          .value as RemoteConfigValueStringToType<Config>;
      }
      try {
        return abby.getRemoteConfig(remoteConfigName);
      } catch {
        return "" as any;
      }
    });
  };

  const useRemoteConfigVariables = (): ComputedRef<
    Array<{
      name: RemoteConfigName;
      value: RemoteConfigValueStringToType<RemoteConfig[RemoteConfigName]>;
    }>
  > => {
    const reactiveData = getReactiveData();
    return computed(() => {
      const currentData = reactiveData.value;
      if (currentData?.remoteConfig) {
        return (
          Object.keys(currentData.remoteConfig) as Array<RemoteConfigName>
        ).map((configName) => ({
          name: configName,
          value: currentData.remoteConfig[configName].value,
        })) as Array<{
          name: RemoteConfigName;
          value: RemoteConfigValueStringToType<RemoteConfig[RemoteConfigName]>;
        }>;
      }
      return [];
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
    return (lookupObject as any)[variant];
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

  const withDevtools: withDevtoolsFunction = (factory, props) => {
    return defineComponent({
      name: "AbbyDevtools",
      setup() {
        let destroy: (() => void) | null = null;
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
          if (destroy) {
            destroy();
          }
        });
        return () => null;
      },
    });
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
