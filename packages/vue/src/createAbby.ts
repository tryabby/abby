import {
  type ABConfig,
  Abby,
  type AbbyConfig,
  type AbbyDataResponse,
  AbbyEventType,
  HttpService,
  type RemoteConfigValueString,
  type RemoteConfigValueStringToType,
  type ValidatorType,
} from "@tryabby/core";
import {
  type App,
  type ComputedRef,
  computed,
  getCurrentInstance,
  onMounted,
  ref,
  shallowRef,
  watch,
} from "vue";
import {
  FlagStorageService,
  RemoteConfigStorageService,
  TestStorageService,
} from "./StorageService";

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
  const User extends Record<string, ValidatorType> = Record<
    string,
    ValidatorType
  >,
>(
  abbyConfig: AbbyConfig<
    FlagName,
    Tests,
    string[],
    RemoteConfigName,
    RemoteConfig,
    User
  >
) {
  const abby = new Abby<
    FlagName,
    TestName,
    Tests,
    RemoteConfig,
    RemoteConfigName,
    string[],
    User
  >(
    abbyConfig,
    {
      get: (key: string) => {
        if (typeof window === "undefined") return null;
        return TestStorageService.get(abbyConfig.projectId, key);
      },
      set: (key: string, value: any) => {
        if (
          typeof window === "undefined" ||
          abbyConfig.cookies?.disableByDefault
        )
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

  const projectData = shallowRef<AbbyProjectData>(abby.getProjectData());

  abby.subscribe((data) => {
    projectData.value = data as AbbyProjectData;
  });

  let loadStarted = false;
  const loadProjectData = () => {
    if (loadStarted) return;
    loadStarted = true;
    abby.loadProjectData().then((data) => {
      if (data) projectData.value = data;
    });
  };

  const abbyPlugin = {
    install(_app: App, options?: { initialData?: AbbyDataResponse }) {
      if (options?.initialData) {
        loadStarted = true;
        projectData.value = abby.init(options.initialData);
        return;
      }
      if (typeof window !== "undefined") loadProjectData();
    },
  };

  const ensureProjectDataLoaded = () => {
    if (typeof window !== "undefined") loadProjectData();
  };

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
    variant: ComputedRef<ABTestReturnValue<Lookup, TestVariant>>;
    onAct: () => void;
  } => {
    ensureProjectDataLoaded();

    // empty on the first render so server and client markup match
    const selectedVariant = ref("");
    let mounted = !getCurrentInstance();

    const syncVariant = () => {
      mounted = true;
      selectedVariant.value =
        projectData.value.tests[name as unknown as TestName]?.selectedVariant ??
        "";
    };

    if (mounted) {
      syncVariant();
    } else {
      onMounted(syncVariant);
    }

    watch(
      () =>
        projectData.value.tests[name as unknown as TestName]?.selectedVariant,
      (newVariant) => {
        if (mounted && newVariant !== undefined) {
          selectedVariant.value = newVariant;
        }
      }
    );

    watch(
      selectedVariant,
      (variant) => {
        if (!variant) return;
        HttpService.sendData({
          url: config.apiUrl,
          type: AbbyEventType.PING,
          data: {
            projectId: config.projectId,
            selectedVariant: variant,
            testName: name as string,
          },
        });
      },
      { flush: "sync" }
    );

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

    const variant = computed(() =>
      lookupObject
        ? lookupObject[selectedVariant.value as TestVariant]
        : (selectedVariant.value as any)
    );

    return { variant, onAct };
  };

  const useFeatureFlag = (name: FlagName): ComputedRef<boolean> => {
    ensureProjectDataLoaded();
    return computed(() => projectData.value.flags[name].value);
  };

  const useFeatureFlags = () => {
    ensureProjectDataLoaded();
    return computed(() =>
      (Object.keys(projectData.value.flags) as Array<FlagName>).map(
        (flagName) => ({
          name: flagName,
          value: projectData.value.flags[flagName].value,
        })
      )
    );
  };

  const useRemoteConfig = <
    T extends RemoteConfigName,
    Config extends RemoteConfig[T],
  >(
    remoteConfigName: T
  ): ComputedRef<RemoteConfigValueStringToType<Config>> => {
    ensureProjectDataLoaded();
    return computed(
      () =>
        projectData.value.remoteConfig[remoteConfigName]
          .value as RemoteConfigValueStringToType<Config>
    );
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

  const getABResetFunction = <T extends keyof Tests>(name: T) => {
    return () => {
      TestStorageService.remove(config.projectId, name as string);
    };
  };

  const getVariants = <T extends keyof Tests>(name: T) => {
    return abby.getVariants(name);
  };

  const updateUserProperties = (
    user: Parameters<typeof abby.updateUserProperties>[0]
  ) => {
    abby.updateUserProperties(user);
  };

  return {
    abbyPlugin,
    useAbby,
    useFeatureFlag,
    useFeatureFlags,
    getFeatureFlagValue,
    useRemoteConfig,
    getRemoteConfig,
    getABTestValue,
    getABResetFunction,
    getVariants,
    updateUserProperties,
    __abby__: abby,
  };
}
