import {
  type ABConfig,
  Abby,
  type AbbyConfig,
  type RemoteConfigValueString,
  type RemoteConfigValueStringToType,
} from "@tryabby/core";
import { HttpService } from "@tryabby/core";
import { type AbbyDataResponse, AbbyEventType } from "@tryabby/core";
import type { AbbyDevtoolProps, DevtoolsFactory } from "@tryabby/devtools";
import { defineComponent, PropType, h, ref, Ref, Component, InjectionKey, provide, inject, watch, watchEffect, Fragment, VNode, onBeforeUpdate, onBeforeUnmount, onUpdated, onMounted, useSlots, onBeforeMount } from 'vue'
import {
  FlagStorageService,
  RemoteConfigStorageService,
  TestStorageService,
} from "./StorageService";

export type withDevtoolsFunction = (
  factory: DevtoolsFactory,
  props: Omit<AbbyDevtoolProps, "abby"> & {
    dangerouslyForceShow?: boolean;
  }
) => () => Component | null;

export type ABTestReturnValue<Lookup, TestVariant> = Lookup extends undefined
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
        if (typeof window === "undefined" || config.cookies?.disableByDefault)
          return;
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

  const AbbyContext = Symbol('AbbyContext') as InjectionKey<Ref<AbbyProjectData>>

  const useAbbyData = () => {
    const data = inject(AbbyContext, null)

    if (!data) {
      throw new Error(
        "useAbbyData must be used within an AbbyProvider. Wrap a parent component in <AbbyProvider> to fix this error."
      );
    }

    return data;
  };

  // we need to return the config as a const so that the types are narrowed
  const config = abbyConfig;

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
    variant: ABTestReturnValue<Lookup, TestVariant>;
    onAct: () => void;
  } => {
    const data = useAbbyData();

    // always render an empty string on the first render to avoid SSR mismatches
    // because the server doesn't know which variant to render
    const selectedVariant = ref("");

    const update = () => {
      const newVariant = data.value.tests[name as unknown as TestName]?.selectedVariant;

      // should never be undefined after mount
      if (newVariant !== undefined) {
        selectedVariant.value = newVariant;
      }
    }
    // listen to changes in for the current variant
    // biome-ignore lint/correctness/useExhaustiveDependencies:>
    watch(() => [data.value.tests[name as unknown as TestName]?.selectedVariant], update);
    onBeforeMount(update)

    // lazily get the tests
    watch(() => name, () => {
      selectedVariant.value = (
        abby.getProjectData().tests[name as unknown as TestName]
          ?.selectedVariant ?? ""
      );
    });

    watchEffect(() => {
      console.log(1123, selectedVariant.value);

      if (!name || !selectedVariant.value) return;

      HttpService.sendData({
        url: config.apiUrl,
        type: AbbyEventType.PING,
        data: {
          projectId: config.projectId,
          selectedVariant: selectedVariant.value,
          testName: name as string,
        },
      });
    });

    const onAct = () => {
      if (!selectedVariant.value) return;

      HttpService.sendData({
        url: config.apiUrl,
        type: AbbyEventType.ACT,
        data: {
          projectId: config.projectId,
          selectedVariant: selectedVariant.value,
          testName: name as string,
        },
      });
    };

    return {
      /**
       * This function can be called to indicate that something that
       * uses the selected variant has been rendered.
       * It will automatically send the selected variant to the server.
       */
      onAct: onAct,
      get variant() {
        if (lookupObject) return lookupObject[selectedVariant.value as TestVariant]
        // Typescript fails here. If we cast selectedVariant to TestVariant
        // it still assumes that it is a string. So we cast it to any instead
        return (selectedVariant.value as any)
      }
    }
  };

  const useFeatureFlag = (name: FlagName) => {
    const data = useAbbyData();
    return data.value.flags[name];
  };

  /**
   * Retruns an Array of all flags with their name and value
   */
  const useFeatureFlags = () => {
    const data = useAbbyData();
    return (Object.keys(data.value.flags) as Array<FlagName>).map((flagName) => ({
      name: flagName,
      value: data.value.flags[flagName],
    }));
  };

  /**
   * Retruns an Array of all rmeote config variables with their name and value
   */
  const useRemoteConfigVariables = () => {
    const data = useAbbyData();
    return (Object.keys(data.value.remoteConfig) as Array<RemoteConfigName>).map(
      (configName) => ({
        name: configName,
        value: data.value.remoteConfig[configName],
      })
    ) as Array<{
      name: RemoteConfigName;
      value: RemoteConfigValueStringToType<RemoteConfig[RemoteConfigName]>;
    }>;
  };

  const AbbyProvider = defineComponent({
    name: "AbbyProvider",
    props: {
      initialData: Object as PropType<AbbyDataResponse>
    },
    setup(props) {
      let isMountedRef = false;

      const projectData = ref<AbbyProjectData | null>((() => {
        if (props.initialData) {
          return abby.init(props.initialData);
        }
        return abby.getProjectData();
      })());

      // load the project data if it hasn't been passed in
      // biome-ignore lint/correctness/useExhaustiveDependencies:>
      onMounted(() => {
        if (props.initialData || isMountedRef) return;
        isMountedRef = true;

        // seed the data with the initial data
        abby.loadProjectData().then((data) => {
          if (!data) return;
          projectData.value = data;
        });
      });

      // subscribe to changes in the project data
      const unsubscribe = abby.subscribe((data) => {
        projectData.value = data;
      });

      onBeforeUpdate(unsubscribe);
      onBeforeUnmount(unsubscribe);

      provide(AbbyContext, projectData as Ref<AbbyProjectData>);

      return { projectData: projectData.value }
    },
    render() {
      const slot = useSlots()?.default?.() ?? [];
      return h(Fragment, { value: this.projectData }, [slot]);
    }
  })

  const getFeatureFlagValue = (name: FlagName) => {
    return abby.getFeatureFlag(name);
  };

  const useRemoteConfig = <
    T extends RemoteConfigName,
    Config extends RemoteConfig[T],
  >(
    remoteConfigName: T
  ): RemoteConfigValueStringToType<Config> => {
    const abby = useAbbyData();
    return abby.value.remoteConfig[
      remoteConfigName
    ] as RemoteConfigValueStringToType<Config>;
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

    return lookupObject[variant as TestVariant] as any;
  };

  const withDevtools: withDevtoolsFunction = (factory, props) => {
    // hacky way to make sure SSR and Edge functions work
    return () => {
      let initedRef = false;

      const destroy = () => {
        initedRef = false;
        factory.create({ ...props, abby });
      }

      onBeforeUpdate(destroy);
      onBeforeUnmount(destroy);

      // biome-ignore lint/correctness/useExhaustiveDependencies:>
      onMounted(() => {
        if (initedRef) {
          return;
        }

        if (
          !props?.dangerouslyForceShow &&
          process.env.NODE_ENV !== "development"
        ) {
          return;
        }

        initedRef = true;

      });
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
