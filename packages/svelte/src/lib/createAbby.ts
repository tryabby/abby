import { Abby, type AbbyConfig, type ABConfig, type FlagValueString } from "@tryabby/core";
import { HttpService, AbbyEventType } from "@tryabby/core";
import { derived, type Readable } from "svelte/store";
import type { F } from "ts-toolbelt";
// import type { LayoutServerLoad, LayoutServerLoadEvent } from "../routes/$types"; TODO fix import
import { FlagStorageService, TestStorageService } from "./StorageService";
import AbbyProvider from "./AbbyProvider.svelte";
import AbbyDevtools from "./AbbyDevtools.svelte";

type ABTestReturnValue<Lookup, TestVariant> = Lookup extends undefined
  ? TestVariant
  : TestVariant extends keyof Lookup
  ? Lookup[TestVariant]
  : never;

export function createAbby<
  FlagName extends string,
  TestName extends string,
  Tests extends Record<TestName, ABConfig>,
  Flags extends Record<FlagName, FlagValueString> = Record<FlagName, FlagValueString>,
  ConfigType extends AbbyConfig<FlagName, Tests> = AbbyConfig<FlagName, Tests>
>(config: F.Narrow<AbbyConfig<FlagName, Tests, Flags>>) {
  const abby = new Abby<FlagName, TestName, Tests, Flags>(
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
    }
  );

  const abbyStore = derived(abby, ($v) => {
    return abby;
  });

  const abbyConfig = config as unknown as ConfigType;

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
    Lookup extends Record<TestVariant, LookupValue> | undefined = undefined
  >(
    testName: TestName,
    lookupObject?: F.Narrow<Lookup>
  ): {
    variant: Readable<ABTestReturnValue<Lookup, TestVariant>>;
    onAct: () => void;
  } => {
    let selectedVariant: string = "";
    const variant = derived<any, ABTestReturnValue<Lookup, TestVariant>>(abby, ($v) => {
      selectedVariant = abby.getTestVariant(testName);
      return lookupObject ? lookupObject[selectedVariant] : selectedVariant;
    });

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
    return derived<any, Readonly<string[]>>(abby, ($v) => {
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
    Lookup extends Record<TestVariant, LookupValue> | undefined = undefined
  >(
    testName: TestName,
    lookupObject?: F.Narrow<Lookup>
  ): ABTestReturnValue<Lookup, TestVariant> => {
    const variant = abby.getTestVariant(testName);
    // Typescript looses its typing here, so we cast as any in favor of having
    // better type inference for the user
    if (lookupObject === undefined) {
      return variant as any;
    }

    return lookupObject[variant as keyof typeof lookupObject] as any;
  };

  const getFeatureFlagValue = <F extends keyof Flags>(featureFlagName: F) => {
    return abby.getFeatureFlag(featureFlagName);
  };

  const useFeatureFlag = <F extends keyof Flags>(flagName: F) => {
    return derived(abby, ($v) => {
      return abby.getFeatureFlag(flagName);
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
