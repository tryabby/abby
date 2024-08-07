import {
  type ABConfig,
  Abby,
  type AbbyConfig,
  type RemoteConfigValueString,
  type RemoteConfigValueStringToType,
} from "@tryabby/core";
import { AbbyEventType, HttpService } from "@tryabby/core";
import { type Readable, derived } from "svelte/store";
import AbbyDevtools from "./AbbyDevtools.svelte";
import AbbyProvider from "./AbbyProvider.svelte";
// import type { LayoutServerLoad, LayoutServerLoadEvent } from "../routes/$types"; TODO fix import
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

  const abbyStore = derived(abby, (_$v) => {
    return abby;
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
    variant: Readable<ABTestReturnValue<Lookup, TestVariant>>;
    onAct: () => void;
  } => {
    let selectedVariant = "";
    const variant = derived<any, ABTestReturnValue<Lookup, TestVariant>>(
      abby,
      (_$v) => {
        selectedVariant = abby.getTestVariant(testName);
        return lookupObject ? lookupObject[selectedVariant] : selectedVariant;
      }
    );

    // ensure side effect is triggered
    variant.subscribe(() => {});

    const onAct = () => {
      HttpService.sendData({
        url: config.apiUrl,
        type: AbbyEventType.ACT,
        data: {
          projectId: config.projectId,
          selectedVariant,
          testName: testName as string,
        },
      });
    };
    notify(testName, selectedVariant);

    return { variant, onAct };
  };

  const getVariants = <T extends keyof Tests>(testName: T) => {
    return derived<any, Readonly<string[]>>(abby, (_$v) => {
      return abby.getVariants(testName);
    });
  };

  /**
   * helper function to reset an Ab Test
   */
  const getABResetFunction = <T extends keyof Tests>(testName: T) => {
    return () => {
      TestStorageService.remove(config.projectId, testName as string);
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
    // Typescript looses its typing here, so we cast as any in favor of having
    // better type inference for the user
    if (lookupObject === undefined) {
      return variant as any;
    }

    return lookupObject[variant as keyof typeof lookupObject] as any;
  };

  const getFeatureFlagValue = (featureFlagName: FlagName) => {
    return abby.getFeatureFlag(featureFlagName);
  };

  const useFeatureFlag = (flagName: FlagName) => {
    return derived(abby, (_$v) => {
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
  ): Readable<RemoteConfigValueStringToType<Config>> => {
    return derived(abby, (_$v) => {
      return abby.getRemoteConfig(remoteConfigName);
    });
  };

  const withAbby = (handler?: any) => {
    //TODO fix type import
    return async (evt: any) => {
      const data = await handler?.(evt);
      const __abby__data = await HttpService.getProjectData({
        url: config.apiUrl,
        projectId: config.projectId,
        environment: config.currentEnvironment,
      });

      return {
        ...data,
        __abby__data,
        __abby_cookie: evt?.request.headers.get("cookie"),
      };
    };
  };

  const withDevTools = () => {
    return AbbyDevtools;
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
    abbyStore,
    withAbby,
    AbbyProvider,
    withDevTools,
  };
}
