import {
  Abby,
  AbbyConfig,
  ABConfig,
  RemoteConfigValueString,
  RemoteConfigValueStringToType,
} from "@tryabby/core";
import React, { useCallback, useEffect, useRef, useState, type PropsWithChildren } from "react";
import { HttpService } from "@tryabby/core";
import { AbbyDataResponse, AbbyEventType } from "@tryabby/core";
import { F } from "ts-toolbelt";
import {
  FlagStorageService,
  RemoteConfigStorageService,
  TestStorageService,
} from "./StorageService";
import type { AbbyDevtoolProps, DevtoolsFactory } from "@tryabby/devtools";

export type withDevtoolsFunction = (
  factory: DevtoolsFactory,
  props: Omit<AbbyDevtoolProps, "abby"> & {
    dangerouslyForceShow?: boolean;
  }
) => () => JSX.Element | null;

export type ABTestReturnValue<Lookup, TestVariant> = Lookup extends undefined
  ? TestVariant
  : TestVariant extends keyof Lookup
    ? Lookup[TestVariant]
    : never;

export function createAbby<
  FlagName extends string,
  TestName extends string,
  Tests extends Record<TestName, ABConfig>,
  RemoteConfig extends Record<RemoteConfigName, RemoteConfigValueString>,
  RemoteConfigName extends Extract<keyof RemoteConfig, string>,
  ConfigType extends AbbyConfig<
    FlagName,
    Tests,
    string[],
    RemoteConfigName,
    RemoteConfig
  > = AbbyConfig<FlagName, Tests, string[], RemoteConfigName, RemoteConfig>,
>(abbyConfig: F.Narrow<AbbyConfig<FlagName, Tests, string[], RemoteConfigName, RemoteConfig>>) {
  const abby = new Abby<FlagName, TestName, Tests, RemoteConfig, RemoteConfigName>(
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

  type AbbyProjectData = ReturnType<typeof abby.getProjectData>;

  const AbbyContext = React.createContext<AbbyProjectData | null>(null);

  const useAbbyData = () => {
    const data = React.useContext(AbbyContext);

    if (!data) {
      throw new Error(
        "useAbbyData must be used within an AbbyProvider. Wrap a parent component in <AbbyProvider> to fix this error."
      );
    }

    return data;
  };

  // we need to return the config as a const so that the types are narrowed
  const config = abbyConfig as unknown as ConfigType;

  const useAbby = <
    K extends keyof Tests,
    TestVariant extends Tests[K]["variants"][number],
    LookupValue,
    Lookup extends Record<TestVariant, LookupValue> | undefined = undefined,
  >(
    name: K,
    lookupObject?: F.Narrow<Lookup>
  ): {
    variant: ABTestReturnValue<Lookup, TestVariant>;
    onAct: () => void;
  } => {
    const { tests } = useAbbyData();

    // always render an empty string on the first render to avoid SSR mismatches
    // because the server doesn't know which variant to render
    const [selectedVariant, setSelectedVariant] = useState("");

    // listen to changes in for the current variant
    useEffect(() => {
      const newVariant = tests[name as unknown as TestName]?.selectedVariant;

      // should never be undefined after mount
      if (newVariant !== undefined) {
        setSelectedVariant(newVariant);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tests[name as unknown as TestName]?.selectedVariant]);

    // lazily get the tests
    useEffect(() => {
      setSelectedVariant(
        abby.getProjectData().tests[name as unknown as TestName]?.selectedVariant ?? ""
      );
    }, [name]);

    useEffect(() => {
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
    }, [name, selectedVariant]);

    const onAct = useCallback(() => {
      if (!selectedVariant) return;

      HttpService.sendData({
        url: config.apiUrl,
        type: AbbyEventType.ACT,
        data: {
          projectId: config.projectId,
          selectedVariant,
          testName: name as string,
        },
      });
    }, [name, selectedVariant]);

    return {
      /**
       * This function can be called to indicate that something that
       * uses the selected variant has been rendered.
       * It will automatically send the selected variant to the server.
       */
      onAct: onAct,
      variant: lookupObject
        ? lookupObject[selectedVariant as keyof typeof lookupObject]
        : // Typescript fails here. If we cast selectedVariant to TestVariant
          // it still assumes that it is a string. So we cast it to any instead
          (selectedVariant as any),
    };
  };

  const useFeatureFlag = (name: FlagName) => {
    const data = useAbbyData();
    return data.flags[name];
  };

  /**
   * Retruns an Array of all flags with their name and value
   */
  const useFeatureFlags = () => {
    const data = useAbbyData();
    return (Object.keys(data.flags) as Array<FlagName>).map((flagName) => ({
      name: flagName,
      value: data.flags[flagName],
    }));
  };

  /**
   * Retruns an Array of all rmeote config variables with their name and value
   */
  const useRemoteConfigVariables = () => {
    const data = useAbbyData();
    return (Object.keys(data.remoteConfig) as Array<RemoteConfigName>).map((configName) => ({
      name: configName,
      value: data.remoteConfig[configName],
    })) as Array<{
      name: RemoteConfigName;
      value: RemoteConfigValueStringToType<RemoteConfig[RemoteConfigName]>;
    }>;
  };

  const AbbyProvider = ({
    children,
    initialData,
  }: PropsWithChildren<{ initialData?: AbbyDataResponse }>) => {
    const isMountedRef = useRef(false);
    const [data, setData] = useState<AbbyProjectData | null>(() => {
      if (initialData) {
        return abby.init(initialData);
      }
      return abby.getProjectData();
    });

    // load the project data if it hasn't been passed in
    useEffect(() => {
      if (initialData || isMountedRef.current) return;
      isMountedRef.current = true;

      // seed the data with the initial data
      abby.loadProjectData().then((data) => {
        if (!data) return;
        setData(data);
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // subscribe to changes in the project data
    useEffect(() => {
      const unsubscribe = abby.subscribe((data) => {
        setData(data);
      });
      return unsubscribe;
    }, []);

    return <AbbyContext.Provider value={data}>{children}</AbbyContext.Provider>;
  };

  const getFeatureFlagValue = (name: FlagName) => {
    return abby.getFeatureFlag(name);
  };

  const useRemoteConfig = <T extends RemoteConfigName, Config extends RemoteConfig[T]>(
    remoteConfigName: T
  ): RemoteConfigValueStringToType<Config> => {
    const abby = useAbbyData();
    return abby.remoteConfig[remoteConfigName] as RemoteConfigValueStringToType<Config>;
  };

  const getRemoteConfig = <T extends RemoteConfigName, Config extends RemoteConfig[T]>(
    remoteConfigName: T
  ): RemoteConfigValueStringToType<Config> => {
    return abby.getRemoteConfig(remoteConfigName);
  };

  const getABTestValue = <
    TestName extends keyof Tests,
    TestVariant extends Tests[TestName]["variants"][number],
    LookupValue,
    Lookup extends Record<TestVariant, LookupValue> | undefined = undefined,
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

  const withDevtools: withDevtoolsFunction = (factory, props) => {
    // hacky way to make sure SSR and Edge functions work
    return () => {
      const initedRef = useRef(false);

      useEffect(() => {
        if (initedRef.current) {
          return;
        }

        if (!props?.dangerouslyForceShow && process.env.NODE_ENV !== "development") {
          return;
        }

        initedRef.current = true;

        const destroy = factory.create({ ...props, abby });

        return () => {
          initedRef.current = false;
          destroy();
        };
      }, []);
      return null;
    };
  };

  /**
   * Simple helper function create a function that resets an AB test
   * @param name the name of the test
   * @returns A function that can be called to reset the test
   */
  const getABResetFunction = <T extends keyof Tests>(name: T) => {
    return () => {
      TestStorageService.remove(config.projectId, name as string);
    };
  };

  /**
   * Simple helper function to get a list of all variants for a given test
   * @param name the name of the test
   * @returns an array of all variants
   */
  const getVariants = <T extends keyof Tests>(name: T) => {
    return abby.getVariants(name);
  };

  return {
    useAbby,
    AbbyProvider,
    useFeatureFlag,
    getFeatureFlagValue,
    useRemoteConfig,
    getRemoteConfig,
    getABTestValue,
    __abby__: abby,
    withDevtools,
    getABResetFunction,
    getVariants,
    useFeatureFlags,
    useRemoteConfigVariables,
  };
}
