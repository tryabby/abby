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
  type Component,
  type ComputedRef,
  type InjectionKey,
  type Plugin,
  type PropType,
  type ShallowRef,
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

export type AbbyDevtoolProps = {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  defaultShow?: boolean;
  shortcut?: string | Array<string>;
};

export type withDevtoolsFunction = (
  factory: {
    create: (props: AbbyDevtoolProps & { abby: unknown }) => () => void;
  },
  props?: Omit<AbbyDevtoolProps, "abby"> & {
    dangerouslyForceShow?: boolean;
  }
) => Component;

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
        if (
          typeof window === "undefined" ||
          abbyConfig.cookies?.disableByDefault
        )
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

  type AbbyProjectData = ReturnType<typeof abby.getProjectData>;

  const abbyState = shallowRef<AbbyProjectData>({
    tests: {},
    flags: {},
    remoteConfig: {},
  } as AbbyProjectData);

  abby.subscribe((data) => {
    abbyState.value = data as AbbyProjectData;
  });

  let inited = false;

  const initData = (initialData?: AbbyDataResponse) => {
    if (initialData) {
      inited = true;
      abbyState.value = abby.init(initialData);
      return;
    }
    if (inited || typeof window === "undefined") return;
    inited = true;

    abby.loadProjectData().then((data) => {
      if (!data) return;
      abbyState.value = data;
    });
  };

  const AbbyKey: InjectionKey<ShallowRef<AbbyProjectData>> = Symbol(
    `abby:${config.projectId}`
  );

  const resolveState = (): ShallowRef<AbbyProjectData> => {
    const instance = getCurrentInstance();
    const injected = instance ? inject(AbbyKey, undefined) : undefined;
    if (injected) return injected;
    initData();
    return abbyState;
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
    const state = resolveState();

    const selectedVariant = computed(
      () =>
        (state.value.tests[name as unknown as TestName]?.selectedVariant ??
          "") as TestVariant
    );

    const variant = computed(
      () =>
        (lookupObject
          ? (lookupObject as Record<TestVariant, LookupValue>)[
              selectedVariant.value
            ]
          : selectedVariant.value) as ABTestReturnValue<Lookup, TestVariant>
    );

    const sendEvent = (type: AbbyEventType) => {
      if (!name || !selectedVariant.value) return;

      HttpService.sendData({
        url: config.apiUrl,
        type,
        data: {
          projectId: config.projectId,
          selectedVariant: selectedVariant.value as string,
          testName: name as string,
        },
      });
    };

    const onAct = () => sendEvent(AbbyEventType.ACT);

    watch(selectedVariant, () => sendEvent(AbbyEventType.PING));

    if (getCurrentInstance()) {
      onMounted(() => sendEvent(AbbyEventType.PING));
    }

    return {
      onAct,
      variant,
    };
  };

  const useFeatureFlag = (name: FlagName): ComputedRef<boolean> => {
    const state = resolveState();
    return computed(() => {
      void state.value;
      return abby.getFeatureFlag(name);
    });
  };

  const useFeatureFlags = (): ComputedRef<
    Array<{ name: FlagName; value: boolean }>
  > => {
    const state = resolveState();
    return computed(() =>
      (Object.keys(state.value.flags) as Array<FlagName>).map((flagName) => ({
        name: flagName,
        value: state.value.flags[flagName].value,
      }))
    );
  };

  const useRemoteConfigVariables = (): ComputedRef<
    Array<{
      name: RemoteConfigName;
      value: RemoteConfigValueStringToType<RemoteConfig[RemoteConfigName]>;
    }>
  > => {
    const state = resolveState();
    return computed(() =>
      (Object.keys(state.value.remoteConfig) as Array<RemoteConfigName>).map(
        (configName) => ({
          name: configName,
          value: state.value.remoteConfig[configName]
            .value as RemoteConfigValueStringToType<
            RemoteConfig[RemoteConfigName]
          >,
        })
      )
    );
  };

  const useRemoteConfig = <
    T extends RemoteConfigName,
    Config extends RemoteConfig[T],
  >(
    remoteConfigName: T
  ): ComputedRef<RemoteConfigValueStringToType<Config>> => {
    const state = resolveState();
    return computed(() => {
      void state.value;
      return abby.getRemoteConfig(
        remoteConfigName
      ) as RemoteConfigValueStringToType<Config>;
    });
  };

  const AbbyProvider = defineComponent({
    name: "AbbyProvider",
    props: {
      initialData: {
        type: Object as PropType<AbbyDataResponse>,
        required: false,
        default: undefined,
      },
    },
    setup(props, { slots }) {
      provide(AbbyKey, abbyState);
      initData(props.initialData);

      return () => slots.default?.() ?? null;
    },
  });

  const AbbyVuePlugin: Plugin = {
    install(app: App, options?: { initialData?: AbbyDataResponse }) {
      app.provide(AbbyKey, abbyState);
      initData(options?.initialData);
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

  const withAbby = <Handler extends (event?: any) => any>(
    handler?: Handler
  ) => {
    return async (event?: any) => {
      const data = await handler?.(event);

      const __abby__data = await HttpService.getProjectData({
        url: config.apiUrl,
        projectId: config.projectId,
        environment: config.currentEnvironment,
      });

      return {
        ...data,
        __abby__data,
        __abby_cookie:
          event?.node?.req?.headers?.cookie ??
          event?.request?.headers?.get?.("cookie"),
      };
    };
  };

  return {
    useAbby,
    AbbyProvider,
    AbbyVuePlugin,
    AbbyPlugin: AbbyVuePlugin,
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
    withAbby,
  };
}
