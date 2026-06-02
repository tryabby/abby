import {
  type ABConfig,
  Abby,
  type AbbyConfig,
  type RemoteConfigValueString,
  type RemoteConfigValueStringToType,
} from "@tryabby/core";
import { AbbyEventType, HttpService } from "@tryabby/core";
import type { AbbyDataResponse } from "@tryabby/core";
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
  abbyConfig: AbbyConfig<
    FlagName,
    Tests,
    string[],
    RemoteConfigName,
    RemoteConfig
  >
) {
  const abby = new Abby<
    FlagName,
    TestName,
    Tests,
    RemoteConfig,
    RemoteConfigName
  >(
    abbyConfig,
    {
      get: (key: string) => {
        if (typeof window === "undefined") return null;
        return TestStorageService.get(abbyConfig.projectId, key);
      },
      set: (key: string, value: any) => {
        if (typeof window === "undefined") return;
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

  // reactive counter that increments whenever abby data changes
  const updateTrigger = ref(0);

  abby.subscribe(() => {
    updateTrigger.value += 1;
  });

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
    const variant = computed(() => {
      // track the update trigger to make this reactive to abby data changes
      const _trigger = updateTrigger.value;
      const selectedVariant = abby.getTestVariant(name);
      return (
        lookupObject
          ? lookupObject[selectedVariant as TestVariant]
          : selectedVariant
      ) as ABTestReturnValue<Lookup, TestVariant>;
    });

    // send ping when the composable is first used
    const selectedVariant = abby.getTestVariant(name);
    if (selectedVariant) {
      HttpService.sendData({
        url: abbyConfig.apiUrl,
        type: AbbyEventType.PING,
        data: {
          projectId: abbyConfig.projectId,
          selectedVariant,
          testName: name as string,
        },
      });
    }

    const onAct = () => {
      const currentVariant = abby.getTestVariant(name);
      if (!currentVariant) return;

      HttpService.sendData({
        url: abbyConfig.apiUrl,
        type: AbbyEventType.ACT,
        data: {
          projectId: abbyConfig.projectId,
          selectedVariant: currentVariant,
          testName: name as string,
        },
      });
    };

    return { variant, onAct };
  };

  const useFeatureFlag = (flagName: FlagName): ComputedRef<boolean> => {
    return computed(() => {
      const _trigger = updateTrigger.value;
      return abby.getFeatureFlag(flagName);
    });
  };

  const useRemoteConfig = <
    T extends RemoteConfigName,
    Config extends RemoteConfig[T],
  >(
    remoteConfigName: T
  ): ComputedRef<RemoteConfigValueStringToType<Config>> => {
    return computed(() => {
      const _trigger = updateTrigger.value;
      return abby.getRemoteConfig(remoteConfigName);
    });
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
    K extends keyof Tests,
    TestVariant extends Tests[K]["variants"][number],
    LookupValue,
    const Lookup extends
      | Record<TestVariant, LookupValue>
      | undefined = undefined,
  >(
    testName: K,
    lookupObject?: Lookup
  ): ABTestReturnValue<Lookup, TestVariant> => {
    const variant = abby.getTestVariant(testName);
    if (lookupObject === undefined) {
      return variant as any;
    }

    return lookupObject[variant as TestVariant] as any;
  };

  const getVariants = <T extends keyof Tests>(testName: T) => {
    return abby.getVariants(testName);
  };

  const getABResetFunction = <T extends keyof Tests>(name: T) => {
    return () => {
      TestStorageService.remove(abbyConfig.projectId, name as string);
    };
  };

  const withAbby = (initialData?: AbbyDataResponse) => {
    if (initialData) {
      abby.init(initialData);
    } else {
      abby.loadProjectData();
    }
  };

  return {
    useAbby,
    useFeatureFlag,
    useRemoteConfig,
    getFeatureFlagValue,
    getRemoteConfig,
    getABTestValue,
    getVariants,
    getABResetFunction,
    withAbby,
    __abby__: abby,
  };
}
