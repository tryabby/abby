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
  provide,
  type Ref,
  type ComputedRef,
  type App,
} from "vue";
import Cookie from "js-cookie";
import {
  type IStorageService,
  type StorageServiceOptions,
  getABStorageKey,
  getFFStorageKey,
  getRCStorageKey,
} from "@tryabby/core";

const DEFAULT_COOKIE_AGE = 365;

class ABStorageService implements IStorageService {
  get(projectId: string, testName: string): string | null {
    const retrievedValue = Cookie.get(getABStorageKey(projectId, testName));
    return retrievedValue || null;
  }
  set(projectId: string, testName: string, value: string, options?: StorageServiceOptions): void {
    Cookie.set(getABStorageKey(projectId, testName), value, {
      expires: options?.expiresInDays ? options.expiresInDays : DEFAULT_COOKIE_AGE,
    });
  }
  remove(projectId: string, testName: string): void {
    Cookie.remove(getABStorageKey(projectId, testName));
  }
}

class FFStorageService implements IStorageService {
  get(projectId: string, flagName: string): string | null {
    return Cookie.get(getFFStorageKey(projectId, flagName)) || null;
  }
  set(projectId: string, flagName: string, value: string): void {
    Cookie.set(getFFStorageKey(projectId, flagName), value, { expires: DEFAULT_COOKIE_AGE });
  }
}

class RCStorageService implements IStorageService {
  get(projectId: string, configName: string): string | null {
    return Cookie.get(getRCStorageKey(projectId, configName)) || null;
  }
  set(projectId: string, configName: string, value: string): void {
    Cookie.set(getRCStorageKey(projectId, configName), value, { expires: DEFAULT_COOKIE_AGE });
  }
}

const TestStorageService = new ABStorageService();
const FlagStorageService = new FFStorageService();
const RemoteConfigStorageService = new RCStorageService();

export type ABTestReturnValue<Lookup, TestVariant> = Lookup extends undefined
  ? TestVariant
  : TestVariant extends keyof Lookup
    ? Lookup[TestVariant]
    : never;

export const ABBY_INJECTION_KEY = Symbol("AbbyInstance");

let globalAbbyInstance: Abby<any, any, any, any, any> | null = null;

export function createAbby<
  const FlagName extends string,
  const TestName extends string,
  const Tests extends Record<TestName, ABConfig>,
  const RemoteConfig extends Record<RemoteConfigName, RemoteConfigValueString>,
  const RemoteConfigName extends Extract<keyof RemoteConfig, string>,
>(config: AbbyConfig<FlagName, Tests, string[], RemoteConfigName, RemoteConfig>) {
  const abby = new Abby<FlagName, TestName, Tests, RemoteConfig, RemoteConfigName>(
    config,
    {
      get: (key: string) => {
        if (typeof window === "undefined") return null;
        return TestStorageService.get(config.projectId, key);
      },
      set: (key: string, value: any) => {
        if (typeof window === "undefined") return;
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

  const abbyPlugin = {
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
  ) => {
    const rawVariant = abby.getTestVariant(testName);
    const variantRef = shallowRef(rawVariant);

    const variant = computed(() => {
      const v = variantRef.value;
      return lookupObject ? lookupObject[v as keyof Lookup] : (v as any);
    });

    const onAct = () => {
      HttpService.sendData({
        url: config.apiUrl,
        type: AbbyEventType.ACT,
        data: {
          projectId: config.projectId,
          selectedVariant: variantRef.value,
          testName: testName as string,
        },
      });
    };

    notify(testName, rawVariant);
    return { variant, onAct };
  };

  const useFeatureFlagLocal = (flagName: FlagName): ComputedRef<boolean> => {
    const flagVal = ref(abby.getFeatureFlag(flagName));
    return computed(() => Boolean(flagVal.value));
  };

  const useRemoteConfigLocal = <
    T extends RemoteConfigName,
    C extends RemoteConfig[T],
  >(
    remoteConfigName: T
  ): ComputedRef<RemoteConfigValueStringToType<C>> => {
    const val = shallowRef(abby.getRemoteConfig(remoteConfigName));
    return computed(() => val.value as RemoteConfigValueStringToType<C>);
  };

  return {
    abby,
    install: abbyPlugin.install,
    useAbby: useAbbyLocal,
    useFeatureFlag: useFeatureFlagLocal,
    useRemoteConfig: useRemoteConfigLocal,
  };
}

/**
 * Top-level Composable useAbby
 */
export function useAbby<LookupValue = any>(
  testName: string,
  lookupObject?: Record<string, LookupValue>
) {
  const instance = inject<Abby<any, any, any, any, any>>(ABBY_INJECTION_KEY, globalAbbyInstance!);
  const currentVariant = shallowRef(instance ? instance.getTestVariant(testName) : "");

  const variant = computed(() => {
    const v = currentVariant.value;
    return lookupObject ? lookupObject[v] : v;
  });

  const onAct = () => {
    if (instance && (instance as any).config) {
      HttpService.sendData({
        url: (instance as any).config.apiUrl,
        type: AbbyEventType.ACT,
        data: {
          projectId: (instance as any).config.projectId,
          selectedVariant: currentVariant.value,
          testName,
        },
      });
    }
  };

  return { variant, onAct };
}

/**
 * Top-level Composable useFeatureFlag
 */
export function useFeatureFlag(flagName: string): ComputedRef<boolean> {
  const instance = inject<Abby<any, any, any, any, any>>(ABBY_INJECTION_KEY, globalAbbyInstance!);
  const val = ref(instance ? instance.getFeatureFlag(flagName) : false);
  return computed(() => Boolean(val.value));
}

/**
 * Top-level Composable useRemoteConfig
 */
export function useRemoteConfig<T = any>(remoteConfigName: string): ComputedRef<T> {
  const instance = inject<Abby<any, any, any, any, any>>(ABBY_INJECTION_KEY, globalAbbyInstance!);
  const val = shallowRef<T>(instance ? instance.getRemoteConfig(remoteConfigName) : (undefined as any));
  return computed(() => val.value);
}

export { type ABConfig, type AbbyConfig, defineConfig } from "@tryabby/core";
