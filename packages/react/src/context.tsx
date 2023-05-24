import { Abby, AbbyConfig, ABConfig } from "@tryabby/core";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { HttpService } from "@tryabby/core";
import { ABBY_INSTANCE_KEY } from "@tryabby/core";
import { AbbyDataResponse, AbbyEventType } from "@tryabby/core";
import { F } from "ts-toolbelt";
import { FlagStorageService, TestStorageService } from "./StorageService";
import type { AbbyDevtoolProps, DevtoolsFactory } from "@tryabby/devtools";

export type withDevtoolsFunction = (
  factory: DevtoolsFactory,
  props: Omit<AbbyDevtoolProps, "abby"> & {
    dangerouslyForceShow?: boolean;
  }
) => () => JSX.Element | null;

export function createAbby<
  FlagName extends string,
  TestName extends string,
  Tests extends Record<TestName, ABConfig>,
  ConfigType extends AbbyConfig<FlagName, Tests> = AbbyConfig<FlagName, Tests>
>(abbyConfig: F.Narrow<AbbyConfig<FlagName, Tests>>) {
  const abby = new Abby<FlagName, TestName, Tests>(
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

  const useAbby = <K extends keyof Tests>(name: K) => {
    const { tests } = useAbbyData();

    // always render an empty string on the first render to avoid SSR mismatches
    // because the server doesn't know which variant to render
    const [selectedVariant, setSelectedVariant] = useState("");

    // listen to changes in for the current variant
    useEffect(() => {
      const newVariant = tests[name as unknown as TestName]?.selectedVariant;

      // should never be undefined after mount
      if (newVariant != null) {
        setSelectedVariant(newVariant);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tests[name as unknown as TestName]?.selectedVariant]);

    // lazily get the tests
    useEffect(() => {
      setSelectedVariant(
        abby.getProjectData().tests[name as unknown as TestName]
          ?.selectedVariant ?? ""
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
      variant: (selectedVariant ?? "") as Tests[K]["variants"][number],
    };
  };

  const useFeatureFlag = <F extends NonNullable<ConfigType["flags"]>[number]>(
    name: F
  ): boolean => {
    const data = useAbbyData();
    return data.flags[name];
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
      abby.loadProjectData();
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

  const getFeatureFlagValue = <
    F extends NonNullable<ConfigType["flags"]>[number]
  >(
    name: F
  ): boolean => {
    return abby.getFeatureFlag(name);
  };

  const getABTestValue = <K extends keyof Tests>(
    name: K
  ): Tests[K]["variants"][number] => {
    return abby.getTestVariant(name);
  };

  const withDevtools: withDevtoolsFunction = (factory, props) => {
    // hacky way to make sure SSR and Edge functions work
    return () => {
      const initedRef = useRef(false);

      useEffect(() => {
        if (initedRef.current) {
          return;
        }

        if (
          !props?.dangerouslyForceShow &&
          process.env.NODE_ENV !== "development"
        ) {
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
      FlagStorageService.remove(config.projectId, name as string);
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
    getABTestValue,
    __abby__: abby,
    withDevtools,
    getABResetFunction,
    getVariants,
  };
}
