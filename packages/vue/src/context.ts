import { computed, defineComponent, inject, provide, ref, type ComputedRef, type InjectionKey } from "vue";
import { createAbbyInstance, type AbbyConfig, type AbbyInstance, type ABConfig, defineConfig } from "@tryabby/core";

export { type ABConfig, type AbbyConfig, defineConfig };

export interface ABTestReturnValue<V extends string> {
  variant: ComputedRef<V>;
  onAct: () => Promise<void> | void;
}

export function createAbby<TConfig extends AbbyConfig>(config: TConfig) {
  const instance: AbbyInstance<TConfig> = createAbbyInstance(config);
  const AbbyKey: InjectionKey<AbbyInstance<TConfig>> = Symbol("AbbyContext");
  const version = ref(0);
  instance.__subscribe?.(() => {
    version.value += 1;
  });

  const AbbyProvider = defineComponent({
    name: "AbbyProvider",
    setup(_, { slots }) {
      provide(AbbyKey, instance);
      return () => slots.default?.();
    },
  });

  function useInstance(): AbbyInstance<TConfig> {
    return inject(AbbyKey, instance);
  }

  function useAbby<TTest extends keyof TConfig["tests"] & string>(
    testName: TTest
  ): ABTestReturnValue<TConfig["tests"][TTest]["variants"][number]> {
    const abby = useInstance();
    const variant = computed(() => {
      void version.value;
      return abby.getVariant(testName);
    });
    return {
      variant,
      onAct: () => abby.onAct(testName),
    };
  }

  function useFeatureFlag<TFlag extends TConfig["flags"][number] & string>(flagName: TFlag): ComputedRef<boolean> {
    const abby = useInstance();
    return computed(() => {
      void version.value;
      return Boolean(abby.getFeatureFlag(flagName));
    });
  }

  function useRemoteConfig<TKey extends keyof NonNullable<TConfig["remoteConfig"]> & string>(
    key: TKey
  ): ComputedRef<unknown> {
    const abby = useInstance();
    return computed(() => {
      void version.value;
      return abby.getRemoteConfig(key);
    });
  }

  return {
    AbbyProvider,
    useAbby,
    useFeatureFlag,
    useRemoteConfig,
    instance,
  };
}
