import { Abby, type AbbyConfig, type ABConfig } from "@tryabby/core";
import { HttpService, AbbyEventType } from "@tryabby/core";
import { derived } from "svelte/store";
import type { F } from "ts-toolbelt";
// import type { LayoutServerLoad, LayoutServerLoadEvent } from "../routes/$types"; TODO fix import
import { FlagStorageService, TestStorageService } from "./StorageService";
import AbbyProvider from "./AbbyProvider.svelte";
import AbbyDevtools from "./AbbyDevtools.svelte";

export function createAbby<
  FlagName extends string,
  TestName extends string,
  Tests extends Record<TestName, ABConfig>,
  ConfigType extends AbbyConfig<FlagName, Tests> = AbbyConfig<FlagName, Tests>
>(config: F.Narrow<AbbyConfig<FlagName, Tests>>) {
  const abby = new Abby<FlagName, TestName, Tests>(
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

  const useAbby = <K extends keyof Tests>(testName: K) => {
    const variant = derived<any, string>(abby, ($v) => {
      return abby.getTestVariant(testName);
    });
    let selectedVariant: string = "";
    variant.subscribe((data) => {
      selectedVariant = data;
    });
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

  const getABTestValue = <T extends keyof Tests>(testName: T) => {
    return abby.getTestVariant(testName);
  };

  const getFeatureFlagValue = <
    F extends NonNullable<ConfigType["flags"]>[number]
  >(
    featureFlagName: F
  ) => {
    return abby.getFeatureFlag(featureFlagName);
  };

  const useFeatureFlag = <F extends NonNullable<ConfigType["flags"]>[number]>(
    flagName: F
  ) => {
    return derived<any, boolean>(abby, ($v) => {
      return abby.getFeatureFlag(flagName);
    });
  };

  const withAbby = (handler?: any) => { //TODO fix type import
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