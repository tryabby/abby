import {
  type ABConfig,
  Abby,
  type AbbyConfig,
  type RemoteConfigValueString,
  type RemoteConfigValueStringToType,
  HttpService,
  AbbyEventType,
} from "@tryabby/core";
import {
  ref,
  computed,
  shallowRef,
  inject,
  getCurrentScope,
  onScopeDispose,
  type Ref,
  type ComputedRef,
  type App,
  type Plugin,
  type InjectionKey,
} from "vue";
import {
  FlagStorageService,
  RemoteConfigStorageService,
  TestStorageService,
} from "./StorageService";

export const ABBY_INJECTION_KEY: InjectionKey<Abby<any, any, any, any, any>> =
  Symbol("ABBY_INSTANCE");

export type ABTestReturnValue<Lookup, TestVariant> = Lookup extends undefined
  ? TestVariant
  : TestVariant extends keyof Lookup
    ? Lookup[TestVariant]
    : never;

let globalAbbyInstance: Abby<any, any, any, any, any> | null = null;

export function createAbby<
  const FlagName extends string,
  const TestName extends string,
  const Tests extends Record<TestName, ABConfig>,
  const RemoteConfig extends Record<RemoteConfigName, RemoteConfigValueString>,
  const RemoteConfigName extends Extract<keyof RemoteConfig, string>,
>(
  config: AbbyConfig<FlagName, Tests, string[], RemoteConfigName, RemoteConfig>
) {
  const abby = new Abby<
    FlagName,
    TestName,
    Tests,
    RemoteConfig,
    RemoteConfigName
  >(
    config,
    {
      get: (key: string) => {
        if (typeof window === "undefined") return null;
        return TestStorageService.get(config.projectId, key);
      },
      set: (key: string, value: any) => {
        if (typeof window === "undefined" || config.cookies?.disableByDefault)
          return;
        TestStorageService.set(config.projectId, key, value);
      },
    },
    {
      get: (key: string) => {
        if (typeof window === "undefined") return null;
        return FlagStorageService.get(config.projectId, key);
      },
      set: (key: string, value: any) => {
        if (typeof window === "undefined") return;
        FlagStorageService.set(config.projectId, key, value);
      },
    },
    {
      get: (key: string) => {
        if (typeof window === "undefined") return null;
        return RemoteConfigStorageService.get(config.projectId, key);
      },
      set: (key: string, value: any) => {
        if (typeof window === "undefined") return;
        RemoteConfigStorageService.set(config.projectId, key, value);
      },
    }
  );

  globalAbbyInstance = abby;

  const abbyPlugin: Plugin = {
    install(app: App) {
      app.provide(ABBY_INJECTION_KEY, abby);
    },
  };

  const notify = <N extends keyof Tests>(name: N, selectedVariant: string) => {
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

  const useAbbyLocal = <
    TName extends keyof Tests,
    TVariant extends Tests[TName]["variants"][number],
    LookupValue,
    const Lookup extends Record<TVariant, LookupValue> | undefined = undefined,
  >(
    testName: TName,
    lookupObject?: Lookup
  ): {
    variant: ComputedRef<ABTestReturnValue<Lookup, TVariant>>;
    onAct: () => void;
  } => {
    const rawVariant = shallowRef(abby.getTestVariant(testName));

    const unsubscribe = abby.subscribe(() => {
      rawVariant.value = abby.getTestVariant(testName);
    });

    if (getCurrentScope()) {
      onScopeDispose(unsubscribe);
    }

    const variant = computed(() => {
      const v = rawVariant.value;
      if (lookupObject === undefined) {
        return v as any;
      }
      return (lookupObject as any)[v];
    });

    const onAct = () => {
      if (!rawVariant.value) return;
      HttpService.sendData({
        url: config.apiUrl,
        type: AbbyEventType.ACT,
        data: {
          projectId: config.projectId,
          selectedVariant: rawVariant.value,
          testName: testName as string,
        },
      });
    };

    notify(testName, rawVariant.value);

    return { variant, onAct };
  };

  const useFeatureFlagLocal = (flagName: FlagName): ComputedRef<boolean> => {
    const flagVal = ref(abby.getFeatureFlag(flagName));

    const unsubscribe = abby.subscribe(() => {
      flagVal.value = abby.getFeatureFlag(flagName);
    });

    if (getCurrentScope()) {
      onScopeDispose(unsubscribe);
    }

    return computed(() => Boolean(flagVal.value));
  };

  const useRemoteConfigLocal = <
    T extends RemoteConfigName,
    C extends RemoteConfig[T],
  >(
    remoteConfigName: T
  ): ComputedRef<RemoteConfigValueStringToType<C>> => {
    const val = shallowRef(abby.getRemoteConfig(remoteConfigName));

    const unsubscribe = abby.subscribe(() => {
      val.value = abby.getRemoteConfig(remoteConfigName);
    });

    if (getCurrentScope()) {
      onScopeDispose(unsubscribe);
    }

    return computed(() => val.value as RemoteConfigValueStringToType<C>);
  };

  const getABTestValue = <
    TName extends keyof Tests,
    TVariant extends Tests[TName]["variants"][number],
    LookupValue,
    const Lookup extends Record<TVariant, LookupValue> | undefined = undefined,
  >(
    testName: TName,
    lookupObject?: Lookup
  ): ABTestReturnValue<Lookup, TVariant> => {
    const v = abby.getTestVariant(testName);
    if (lookupObject === undefined) {
      return v as any;
    }
    return (lookupObject as any)[v];
  };

  const getFeatureFlagValue = (flagName: FlagName): boolean => {
    return Boolean(abby.getFeatureFlag(flagName));
  };

  const getRemoteConfig = <
    T extends RemoteConfigName,
    C extends RemoteConfig[T],
  >(
    remoteConfigName: T
  ): RemoteConfigValueStringToType<C> => {
    return abby.getRemoteConfig(remoteConfigName);
  };

  const getABResetFunction = (testName: keyof Tests) => {
    return () => {
      TestStorageService.remove(config.projectId, testName as string);
    };
  };

  const getVariants = (testName: keyof Tests) => {
    return abby.getVariants(testName);
  };

  return {
    abby,
    install: abbyPlugin.install,
    plugin: abbyPlugin,
    useAbby: useAbbyLocal,
    useFeatureFlag: useFeatureFlagLocal,
    useRemoteConfig: useRemoteConfigLocal,
    getABTestValue,
    getFeatureFlagValue,
    getRemoteConfig,
    getABResetFunction,
    getVariants,
  };
}

/**
 * Top-level Composable: useAbby
 */
export function useAbby<LookupValue = any>(
  testName: string,
  lookupObject?: Record<string, LookupValue>
) {
  const instance = inject(ABBY_INJECTION_KEY, globalAbbyInstance);
  if (!instance) {
    throw new Error(
      "No Abby instance found. Initialize createAbby() or install the Abby plugin into your Vue app."
    );
  }

  const currentVariant = shallowRef(instance.getTestVariant(testName));

  const unsubscribe = instance.subscribe(() => {
    currentVariant.value = instance.getTestVariant(testName);
  });

  if (getCurrentScope()) {
    onScopeDispose(unsubscribe);
  }

  const variant = computed(() => {
    const v = currentVariant.value;
    return lookupObject ? (lookupObject as any)[v] : (v as any);
  });

  const onAct = () => {
    const cfg = (instance as any).config;
    if (cfg && currentVariant.value) {
      HttpService.sendData({
        url: cfg.apiUrl,
        type: AbbyEventType.ACT,
        data: {
          projectId: cfg.projectId,
          selectedVariant: currentVariant.value,
          testName,
        },
      });
    }
  };

  return { variant, onAct };
}

/**
 * Top-level Composable: useFeatureFlag
 */
export function useFeatureFlag(flagName: string): ComputedRef<boolean> {
  const instance = inject(ABBY_INJECTION_KEY, globalAbbyInstance);
  if (!instance) {
    throw new Error(
      "No Abby instance found. Initialize createAbby() or install the Abby plugin into your Vue app."
    );
  }

  const val = ref(instance.getFeatureFlag(flagName));

  const unsubscribe = instance.subscribe(() => {
    val.value = instance.getFeatureFlag(flagName);
  });

  if (getCurrentScope()) {
    onScopeDispose(unsubscribe);
  }

  return computed(() => Boolean(val.value));
}

/**
 * Top-level Composable: useRemoteConfig
 */
export function useRemoteConfig<T = any>(
  remoteConfigName: string
): ComputedRef<T> {
  const instance = inject(ABBY_INJECTION_KEY, globalAbbyInstance);
  if (!instance) {
    throw new Error(
      "No Abby instance found. Initialize createAbby() or install the Abby plugin into your Vue app."
    );
  }

  const val = shallowRef<T>(instance.getRemoteConfig(remoteConfigName) as any);

  const unsubscribe = instance.subscribe(() => {
    val.value = instance.getRemoteConfig(remoteConfigName) as any;
  });

  if (getCurrentScope()) {
    onScopeDispose(unsubscribe);
  }

  return computed(() => val.value);
}

export { type ABConfig, type AbbyConfig, defineConfig } from "@tryabby/core";
