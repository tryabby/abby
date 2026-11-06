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
  getABStorageKey,
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

export type AbbyUserProperties<
  User extends Record<string, ValidatorType> = Record<string, ValidatorType>,
> = Partial<{
  -readonly [K in keyof User]: Infer<User[K]>;
}>;

export type AbbyInitialData<
  TestName extends string = string,
  User extends Record<string, ValidatorType> = Record<string, ValidatorType>,
> = AbbyDataResponse & {
  selectedVariants?: Partial<Record<TestName, string>>;
  userProperties?: AbbyUserProperties<User>;
};

/**
 * Parses a raw HTTP `Cookie` header string into a key-value map.
 */
function parseCookieHeader(cookieHeader?: string | null): Map<string, string> {
  const cookies = new Map<string, string>();
  if (!cookieHeader) return cookies;

  for (const part of cookieHeader.split(";")) {
    const separatorIndex = part.indexOf("=");
    if (separatorIndex === -1) continue;
    const rawKey = part.slice(0, separatorIndex).trim();
    const rawValue = part.slice(separatorIndex + 1).trim();
    if (!rawKey) continue;
    try {
      cookies.set(decodeURIComponent(rawKey), decodeURIComponent(rawValue));
    } catch {
      cookies.set(rawKey, rawValue);
    }
  }
  return cookies;
}

/**
 * Creates a typed Abby instance, Vue composables, provider/plugin, and SSR helpers.
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

  type AbbyInstance = Abby<
    FlagName,
    TestName,
    Tests,
    RemoteConfig,
    RemoteConfigName,
    string[],
    User
  >;
  type AbbyProjectData = ReturnType<AbbyInstance["getProjectData"]>;

  type AbbyScopedContext = {
    abby: AbbyInstance;
    state: ShallowRef<AbbyProjectData>;
    initData: (initialData?: AbbyInitialData<TestName, User>) => void;
    clearTest: (testName: string) => void;
  };

  /**
   * Creates an isolated Abby instance and reactive state container so SSR requests do not share mutable state.
   */
  const createScopedContext = (
    requestVariants?: Map<string, string>
  ): AbbyScopedContext => {
    const serverTestStore = new Map<string, string>(requestVariants);

    const clonedTests = config.tests
      ? (Object.fromEntries(
          Object.entries(config.tests).map(([testName, testConfig]) => [
            testName,
            {
              ...testConfig,
              variants: [...testConfig.variants],
              weights: testConfig.weights ? [...testConfig.weights] : undefined,
            },
          ])
        ) as Tests)
      : undefined;

    const instanceConfig: AbbyConfig<
      FlagName,
      Tests,
      string[],
      RemoteConfigName,
      RemoteConfig,
      User
    > = {
      ...config,
      tests: clonedTests as Tests,
      cookies: config.cookies ? { ...config.cookies } : undefined,
    };

    const instance = new Abby<
      FlagName,
      TestName,
      Tests,
      RemoteConfig,
      RemoteConfigName,
      string[],
      User
    >(
      instanceConfig,
      {
        get: (key: string) => {
          if (instanceConfig.cookies?.disableByDefault) {
            return null;
          }
          if (typeof window === "undefined") {
            return serverTestStore.get(key) ?? null;
          }
          return (
            TestStorageService.get(instanceConfig.projectId, key) ??
            serverTestStore.get(key) ??
            null
          );
        },
        set: (key: string, value: any) => {
          if (instanceConfig.cookies?.disableByDefault) return;
          serverTestStore.set(key, String(value));
          if (typeof window !== "undefined") {
            TestStorageService.set(instanceConfig.projectId, key, value);
          }
        },
      },
      {
        get: (key: string) => {
          if (typeof window === "undefined") return null;
          return FlagStorageService.get(instanceConfig.projectId, key);
        },
        set: (key: string, value: any) => {
          if (typeof window === "undefined") return;
          FlagStorageService.set(instanceConfig.projectId, key, value);
        },
      },
      {
        get: (key: string) => {
          if (typeof window === "undefined") return null;
          return RemoteConfigStorageService.get(instanceConfig.projectId, key);
        },
        set: (key: string, value: any) => {
          if (typeof window === "undefined") return;
          RemoteConfigStorageService.set(instanceConfig.projectId, key, value);
        },
      }
    );

    const state = shallowRef<AbbyProjectData>({
      tests: {},
      flags: {},
      remoteConfig: {},
    } as AbbyProjectData);

    instance.subscribe((data) => {
      state.value = data as AbbyProjectData;
    });

    let inited = false;

    const initData = (initialData?: AbbyInitialData<TestName, User>) => {
      if (initialData) {
        inited = true;
        if (initialData.userProperties) {
          instance.updateUserProperties(initialData.userProperties);
        }

        if (
          initialData.selectedVariants &&
          !instanceConfig.cookies?.disableByDefault
        ) {
          for (const [testName, selected] of Object.entries(
            initialData.selectedVariants
          )) {
            if (typeof selected !== "string" || !selected) continue;
            serverTestStore.set(testName, selected);
            if (
              typeof window !== "undefined" &&
              !TestStorageService.get(instanceConfig.projectId, testName)
            ) {
              TestStorageService.set(
                instanceConfig.projectId,
                testName,
                selected
              );
            }
          }
        }

        const initialized = instance.init(initialData);
        state.value = initialized;

        if (!instanceConfig.cookies?.disableByDefault) {
          const serializedVariants: Partial<Record<TestName, string>> = {
            ...initialData.selectedVariants,
          };
          for (const [testName, testData] of Object.entries(
            initialized.tests
          )) {
            const selected = (testData as { selectedVariant?: string })
              ?.selectedVariant;
            if (selected) {
              serializedVariants[testName as TestName] = selected;
            }
          }
          initialData.selectedVariants = serializedVariants;
        }
        return;
      }

      if (inited || typeof window === "undefined") return;
      inited = true;

      instance.loadProjectData().then((data) => {
        if (!data) return;
        state.value = data;
      });
    };

    return {
      abby: instance,
      state,
      initData,
      clearTest: (testName: string) => {
        serverTestStore.delete(testName);
      },
    };
  };

  const defaultContext = createScopedContext();
  let activeClientContext: AbbyScopedContext = defaultContext;
  let activeServerContext: AbbyScopedContext | undefined;
  const abby = defaultContext.abby;

  const AbbyKey: InjectionKey<AbbyScopedContext> = Symbol(
    `abby:${config.projectId}`
  );

  const resolveContext = (): AbbyScopedContext => {
    const instance = getCurrentInstance();
    const injected = instance ? inject(AbbyKey, undefined) : undefined;
    if (injected) return injected;
    if (typeof window === "undefined") {
      return activeServerContext ?? createScopedContext();
    }
    activeClientContext.initData();
    return activeClientContext;
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
    const { state } = resolveContext();

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
    const ctx = resolveContext();
    return computed(() => {
      void ctx.state.value;
      return ctx.abby.getFeatureFlag(name);
    });
  };

  const useFeatureFlags = (): ComputedRef<
    Array<{ name: FlagName; value: boolean }>
  > => {
    const { state } = resolveContext();
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
    const { state } = resolveContext();
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
    const ctx = resolveContext();
    return computed(() => {
      void ctx.state.value;
      return ctx.abby.getRemoteConfig(
        remoteConfigName
      ) as RemoteConfigValueStringToType<Config>;
    });
  };

  const AbbyProvider = defineComponent({
    name: "AbbyProvider",
    props: {
      initialData: {
        type: Object as PropType<AbbyInitialData<TestName, User>>,
        required: false,
        default: undefined,
      },
      userProperties: {
        type: Object as PropType<AbbyUserProperties<User>>,
        required: false,
        default: undefined,
      },
    },
    setup(props, { slots }) {
      const scoped =
        typeof window === "undefined" ||
        props.initialData ||
        props.userProperties
          ? createScopedContext()
          : defaultContext;
      if (props.userProperties) {
        scoped.abby.updateUserProperties(props.userProperties);
      }
      if (typeof window !== "undefined") {
        activeClientContext = scoped;
      }
      provide(AbbyKey, scoped);
      scoped.initData(props.initialData);

      return () => slots.default?.() ?? null;
    },
  });

  const AbbyVuePlugin: Plugin = {
    install(
      app: App,
      options?: {
        initialData?: AbbyInitialData<TestName, User>;
        userProperties?: AbbyUserProperties<User>;
      }
    ) {
      const scoped =
        typeof window === "undefined" ||
        options?.initialData ||
        options?.userProperties
          ? createScopedContext()
          : defaultContext;
      if (options?.userProperties) {
        scoped.abby.updateUserProperties(options.userProperties);
      }
      if (typeof window !== "undefined") {
        activeClientContext = scoped;
      }
      app.provide(AbbyKey, scoped);
      scoped.initData(options?.initialData);
    },
  };

  const getFeatureFlagValue = (name: FlagName) => {
    return resolveContext().abby.getFeatureFlag(name);
  };

  const getRemoteConfig = <
    T extends RemoteConfigName,
    Config extends RemoteConfig[T],
  >(
    remoteConfigName: T
  ): RemoteConfigValueStringToType<Config> => {
    return resolveContext().abby.getRemoteConfig(remoteConfigName);
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
    const variant = resolveContext().abby.getTestVariant(testName);
    if (lookupObject === undefined) {
      return variant as any;
    }

    return lookupObject[variant as TestVariant] as any;
  };

  const withDevtools: withDevtoolsFunction = (factory, props) => {
    return defineComponent({
      name: "AbbyDevtools",
      setup() {
        const ctx = resolveContext();
        let destroy: (() => void) | undefined;

        onMounted(() => {
          if (
            !props?.dangerouslyForceShow &&
            process.env.NODE_ENV !== "development"
          ) {
            return;
          }

          destroy = factory.create({ ...props, abby: ctx.abby });
        });

        onUnmounted(() => {
          destroy?.();
        });

        return () => null;
      },
    });
  };

  const getABResetFunction = <T extends keyof Tests>(name: T) => {
    const instance = getCurrentInstance();
    const injected = instance ? inject(AbbyKey, undefined) : undefined;
    return () => {
      const testKey = name as string;
      TestStorageService.remove(config.projectId, testKey);
      injected?.clearTest(testKey);
      activeClientContext.clearTest(testKey);
      defaultContext.clearTest(testKey);
    };
  };

  const getVariants = <T extends keyof Tests>(name: T) => {
    return resolveContext().abby.getVariants(name);
  };

  const updateUserProperties = (
    user: AbbyUserProperties<User>,
    targetInitialData?: AbbyInitialData<TestName, User>
  ) => {
    if (targetInitialData) {
      targetInitialData.userProperties = {
        ...targetInitialData.userProperties,
        ...user,
      };
    }
    const instance = getCurrentInstance();
    const injected = instance ? inject(AbbyKey, undefined) : undefined;
    if (injected) {
      injected.abby.updateUserProperties(user);
      return;
    }
    if (typeof window === "undefined") {
      activeServerContext?.abby.updateUserProperties(user);
      return;
    }
    activeClientContext.abby.updateUserProperties(user);
    if (activeClientContext !== defaultContext) {
      defaultContext.abby.updateUserProperties(user);
    }
  };

  const withAbby = <
    Handler extends (
      event?: any,
      helpers?: {
        updateUserProperties: (user: AbbyUserProperties<User>) => void;
      }
    ) => any,
  >(
    handler?: Handler
  ) => {
    return async (event?: any) => {
      let requestUserProperties: AbbyUserProperties<User> | undefined;
      const requestScoped = createScopedContext();
      const setRequestUserProperties = (user: AbbyUserProperties<User>) => {
        requestUserProperties = {
          ...requestUserProperties,
          ...user,
        };
        requestScoped.abby.updateUserProperties(user);
      };

      const prevServerContext = activeServerContext;
      activeServerContext = requestScoped;
      let data: any;
      try {
        data = await handler?.(event, {
          updateUserProperties: setRequestUserProperties,
        });
      } finally {
        activeServerContext = prevServerContext;
      }

      const rawProjectData = await HttpService.getProjectData({
        url: config.apiUrl,
        projectId: config.projectId,
        environment: config.currentEnvironment,
      });

      const __abby__data: AbbyInitialData<TestName, User> | null =
        rawProjectData
          ? {
              ...rawProjectData,
              ...(requestUserProperties
                ? { userProperties: requestUserProperties }
                : {}),
            }
          : null;

      if (__abby__data) {
        if (!config.cookies?.disableByDefault) {
          const rawCookieHeader =
            event?.node?.req?.headers?.cookie ??
            event?.request?.headers?.get?.("cookie");
          const parsedCookies = parseCookieHeader(rawCookieHeader);
          const requestVariants = new Map<string, string>();

          for (const testName of Object.keys(config.tests ?? {})) {
            const storageKey = getABStorageKey(config.projectId, testName);
            const cookieVariant = parsedCookies.get(storageKey);
            if (cookieVariant) {
              requestVariants.set(testName, cookieVariant);
            }
          }

          const hydratedContext = createScopedContext(requestVariants);
          hydratedContext.initData(__abby__data);
        } else if (__abby__data.userProperties) {
          const hydratedContext = createScopedContext();
          hydratedContext.initData(__abby__data);
        }
      }

      return {
        ...data,
        __abby__data,
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
