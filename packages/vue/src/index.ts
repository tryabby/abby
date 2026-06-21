import {
  Abby,
  AbbyEventType,
  type ABConfig,
  type AbbyConfig,
  type RemoteConfigValueString,
  type RemoteConfigValueStringToType,
  HttpService,
} from "@tryabby/core";
import { ref, readonly, type InjectionKey, type Ref } from "vue";

export type { AbbyConfig, ABConfig };

const ABBY_INJECTION_KEY = Symbol("abby") as InjectionKey<{
  abby: InstanceType<typeof Abby>;
}>;

export function createAbby<
  const FlagName extends string,
  const TestName extends string,
  const Tests extends Record<TestName, ABConfig>,
  const RemoteConfig extends Record<RemoteConfigName, RemoteConfigValueString>,
  const RemoteConfigName extends Extract<keyof RemoteConfig, string>,
>(config: AbbyConfig<FlagName, Tests, string[], RemoteConfigName, RemoteConfig>) {
  const abby = new Abby<FlagName, TestName, Tests, RemoteConfig, RemoteConfigName>(config, {
    get: (key: string) => {
      if (typeof window === "undefined") return null;
      try {
        return window.localStorage.getItem(key);
      } catch {
        // localStorage can throw SecurityError in private/restricted contexts
        // or when storage access is blocked; fall back to no stored value.
        return null;
      }
    },
    set: (key: string, value: string) => {
      if (typeof window === "undefined") return;
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // Ignore SecurityError (private mode) and QuotaExceededError (storage full).
      }
    },
  });

  function AbbyPlugin(app: { provide: (key: symbol, value: unknown) => void }) {
    app.provide(ABBY_INJECTION_KEY, { abby });
  }

  function useAbby<T extends TestName>(
    testName: T
  ): {
    variant: Readonly<Ref<Tests[T]["variants"][number]>>;
    onAct: () => void;
  } {
    const selectedVariant = abby.getTestVariant(testName);
    const variant = ref(selectedVariant) as Ref<Tests[T]["variants"][number]>;

    const onAct = () => {
      HttpService.sendData({
        url: config.apiUrl,
        type: AbbyEventType.ACT,
        data: {
          projectId: config.projectId,
          selectedVariant: variant.value as string,
          testName: testName as string,
        },
      });
    };

    return { variant: readonly(variant) as Readonly<Ref<Tests[T]["variants"][number]>>, onAct };
  }

  function useFeatureFlag(flagName: FlagName): Readonly<Ref<boolean>> {
    return readonly(ref(abby.getFeatureFlag(flagName)));
  }

  function useRemoteConfig<T extends RemoteConfigName>(
    configName: T
  ): Readonly<Ref<RemoteConfigValueStringToType<RemoteConfig[T]>>> {
    return readonly(
      ref(abby.getRemoteConfig(configName)) as Ref<RemoteConfigValueStringToType<RemoteConfig[T]>>
    ) as Readonly<Ref<RemoteConfigValueStringToType<RemoteConfig[T]>>>;
  }

  return {
    AbbyPlugin,
    useAbby,
    useFeatureFlag,
    useRemoteConfig,
    __abby__: abby,
  };
}
