import { inject, ref, readonly, onUnmounted, type App, type InjectionKey, type Ref } from "vue";
import {
  type ABConfig,
  Abby,
  type AbbyConfig,
  AbbyEventType,
  HttpService,
  type IStorageService,
  type RemoteConfigValueString,
  type RemoteConfigValueStringToType,
  type ValidatorType,
  getABStorageKey,
  getFFStorageKey,
  getRCStorageKey,
} from "@tryabby/core";
import Cookie from "js-cookie";

const DEFAULT_COOKIE_AGE = 365;
const isClient = () => typeof window !== "undefined";

function makeCookieStore(getKey: (projectId: string, name: string) => string): IStorageService {
  return {
    get(projectId: string, name: string): string | null {
      if (!isClient()) return null;
      return Cookie.get(getKey(projectId, name)) ?? null;
    },
    set(projectId: string, name: string, value: string, options?: { expiresInDays?: number }): void {
      if (!isClient()) return;
      Cookie.set(getKey(projectId, name), value, {
        expires: options?.expiresInDays ?? DEFAULT_COOKIE_AGE,
      });
    },
    remove(projectId: string, name: string): void {
      if (!isClient()) return;
      Cookie.remove(getKey(projectId, name));
    },
  };
}

const TestStore = makeCookieStore(getABStorageKey);
const FlagStore = makeCookieStore(getFFStorageKey);
const RemoteConfigStore = makeCookieStore(getRCStorageKey);

export const ABBY_INJECTION_KEY: InjectionKey<Abby<any, any, any, any, any, any, any>> = Symbol("abby");

export function createAbby<
  const FlagName extends string,
  const TestName extends string,
  const Tests extends Record<TestName, ABConfig>,
  const RemoteConfig extends Record<RemoteConfigName, RemoteConfigValueString>,
  const RemoteConfigName extends Extract<keyof RemoteConfig, string>,
  const User extends Record<string, ValidatorType> = Record<string, ValidatorType>,
>(
  abbyConfig: AbbyConfig<FlagName, Tests, string[], RemoteConfigName, RemoteConfig, User>
) {
  const core = new Abby<FlagName, TestName, Tests, RemoteConfig, RemoteConfigName, string[], User>(
    abbyConfig,
    {
      get: (key: string) => TestStore.get(abbyConfig.projectId, key),
      set: (key: string, value: any) => {
        if (abbyConfig.cookies?.disableByDefault) return;
        TestStore.set(abbyConfig.projectId, key, value);
      },
    },
    {
      get: (key: string) => FlagStore.get(abbyConfig.projectId, key),
      set: (key: string, value: any) => FlagStore.set(abbyConfig.projectId, key, value),
    },
    {
      get: (key: string) => RemoteConfigStore.get(abbyConfig.projectId, key),
      set: (key: string, value: any) => RemoteConfigStore.set(abbyConfig.projectId, key, value),
    }
  );

  const useAbby = () => core;

  const useFeatureFlag = (flagKey: FlagName): Readonly<Ref<boolean>> => {
    const value = ref<boolean>(Boolean(core.getFeatureFlag(flagKey)));
    if (isClient()) {
      const unsubscribe = core.subscribe(() => {
        value.value = Boolean(core.getFeatureFlag(flagKey));
      });
      onUnmounted(() => {
        if (typeof unsubscribe === "function") unsubscribe();
      });
    }
    return readonly(value);
  };

  const useRemoteConfig = <Key extends RemoteConfigName>(
    configKey: Key
  ): Readonly<Ref<RemoteConfigValueStringToType<RemoteConfig[Key]>>> => {
    const value = ref(core.getRemoteConfig(configKey)) as Ref<
      RemoteConfigValueStringToType<RemoteConfig[Key]>
    >;
    if (isClient()) {
      const unsubscribe = core.subscribe(() => {
        value.value = core.getRemoteConfig(configKey);
      });
      onUnmounted(() => {
        if (typeof unsubscribe === "function") unsubscribe();
      });
    }
    return readonly(value);
  };

  const useAbTest = <K extends TestName>(testName: K) => {
    const variant = ref<Tests[K]["variants"][number]>(core.getTestVariant(testName));
    if (isClient()) {
      const unsubscribe = core.subscribe(() => {
        variant.value = core.getTestVariant(testName);
      });
      onUnmounted(() => {
        if (typeof unsubscribe === "function") unsubscribe();
      });
    }
    return {
      variant: readonly(variant),
      onAct: () => {
        if (!variant.value) return;
        HttpService.sendData({
          url: abbyConfig.apiUrl,
          type: AbbyEventType.ACT,
          data: {
            projectId: abbyConfig.projectId,
            selectedVariant: variant.value as string,
            testName: testName as string,
          },
        });
      },
    };
  };

  const plugin = {
    install(app: App) {
      app.provide(ABBY_INJECTION_KEY, core);
      app.config.globalProperties.$abby = core;
    },
  };

  return {
    abby: core,
    plugin,
    useAbby,
    useFeatureFlag,
    useRemoteConfig,
    useAbTest,
  };
}

export function useInjectedAbby() {
  const instance = inject(ABBY_INJECTION_KEY);
  if (!instance) {
    throw new Error("Abby plugin is not installed. Call app.use(abby.plugin) first.");
  }
  return instance;
}
