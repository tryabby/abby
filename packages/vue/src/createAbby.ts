import {
  type ABConfig,
  Abby,
  type AbbyConfig,
  AbbyEventType,
  HttpService,
  type RemoteConfigValueString,
  type RemoteConfigValueStringToType,
  type StorageServiceOptions,
} from "@tryabby/core";
import { type ComputedRef, computed, ref } from "vue";
import {
  FlagStorageService,
  RemoteConfigStorageService,
  TestStorageService,
} from "./StorageService";

type ABTestReturnValue<Lookup, TestVariant> = Lookup extends undefined
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
      set: (key: string, value: any, options?: StorageServiceOptions) => {
        if (typeof window === "undefined") return;
        TestStorageService.set(config.projectId, key, value, options);
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

  // Bump a global tick whenever the underlying Abby data changes so all
  // composables recompute. Vue's reactivity cannot observe the Abby class
  // directly, so the tick bridges the two worlds.
  const tick = ref(0);
  abby.subscribe(() => {
    tick.value++;
  });

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

  const useAbby = <
    TestName extends keyof Tests,
    TestVariant extends Tests[TestName]["variants"][number],
    LookupValue,
    const Lookup extends
      | Record<TestVariant, LookupValue>
      | undefined = undefined,
  >(
    testName: TestName,
    lookupObject?: Lookup
  ): {
    variant: ComputedRef<ABTestReturnValue<Lookup, TestVariant>>;
    onAct: () => void;
  } => {
    let cachedVariant:
      | { tick: number; value: Tests[TestName]["variants"][number] }
      | undefined;
    const selectedVariant = computed(() => {
      const currentTick = tick.value;
      if (!cachedVariant || cachedVariant.tick !== currentTick) {
        cachedVariant = {
          tick: currentTick,
          value: abby.getTestVariant(testName),
        };
      }
      return cachedVariant.value;
    });

    const variant = computed<ABTestReturnValue<Lookup, TestVariant>>(() => {
      return lookupObject
        ? (lookupObject as any)[selectedVariant.value]
        : (selectedVariant.value as any);
    });

    const onAct = () => {
      HttpService.sendData({
        url: config.apiUrl,
        type: AbbyEventType.ACT,
        data: {
          projectId: config.projectId,
          selectedVariant: selectedVariant.value,
          testName: testName as string,
        },
      });
    };

    notify(testName, selectedVariant.value);

    return { variant, onAct };
  };

  const getVariants = <T extends keyof Tests>(testName: T) => {
    return computed<Readonly<string[]>>(() => {
      tick.value;
      return abby.getVariants(testName) as unknown as Readonly<string[]>;
    });
  };

  /**
   * helper function to reset an Ab Test
   */
  const getABResetFunction = <T extends keyof Tests>(testName: T) => {
    return () => {
      TestStorageService.remove(config.projectId, testName as string);
      tick.value++;
    };
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
    // Typescript loses its typing here, so we cast as any in favor of having
    // better type inference for the user
    if (lookupObject === undefined) {
      return variant as any;
    }

    return (lookupObject as any)[variant] as any;
  };

  const getFeatureFlagValue = (featureFlagName: FlagName) => {
    return abby.getFeatureFlag(featureFlagName);
  };

  const useFeatureFlag = (flagName: FlagName): ComputedRef<boolean> => {
    return computed(() => {
      tick.value;
      return abby.getFeatureFlag(flagName);
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

  const useRemoteConfig = <
    T extends RemoteConfigName,
    Config extends RemoteConfig[T],
  >(
    remoteConfigName: T
  ): ComputedRef<RemoteConfigValueStringToType<Config>> => {
    return computed(() => {
      tick.value;
      return abby.getRemoteConfig(remoteConfigName);
    });
  };

  return {
    useAbby,
    useFeatureFlag,
    getFeatureFlagValue,
    getRemoteConfig,
    useRemoteConfig,
    getABTestValue,
    __abby__: abby,
    getABResetFunction,
    getVariants,
  };
}
