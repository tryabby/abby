import {
  type ABConfig,
  Abby,
  type AbbyConfig,
  type RemoteConfigValueString,
  type RemoteConfigValueStringToType,
  type ValidatorType,
  HttpService,
  AbbyEventType,
} from "@tryabby/core";
import { ref, computed, onMounted, type Ref, type ComputedRef } from "vue";
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
        if (typeof window === "undefined" || abbyConfig.cookies?.disableByDefault)
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

  /**
   * Reports an experiment exposure (PING) to the Abby analytics backend
   */
  function reportExposure(testName: string, selectedVariant: string) {
    if (!testName || !selectedVariant) return;
    HttpService.sendData({
      url: abbyConfig.apiUrl,
      type: AbbyEventType.PING,
      data: {
        projectId: abbyConfig.projectId,
        selectedVariant,
        testName,
      },
    });
  }

  /**
   * Vue 3 Composable for A/B Testing with automatic exposure reporting and reactivity
   */
  function useAbby<
    TName extends keyof Tests,
    TestVariant extends Tests[TName]["variants"][number],
    LookupValue = undefined,
    const Lookup extends Record<TestVariant, LookupValue> | undefined = undefined,
  >(testName: TName, lookupObject?: Lookup) {
    const rawVariant = abby.getTestVariant(testName);
    const variantRef = ref(rawVariant) as Ref<TestVariant>;

    // Send exposure PING on component mount / usage
    onMounted(() => {
      if (variantRef.value) {
        reportExposure(testName as string, variantRef.value as string);
      }
    });

    const onAct = () => {
      if (!variantRef.value) return;
      HttpService.sendData({
        url: abbyConfig.apiUrl,
        type: AbbyEventType.ACT,
        data: {
          projectId: abbyConfig.projectId,
          selectedVariant: variantRef.value as string,
          testName: testName as string,
        },
      });
    };

    const variant = computed(() => {
      if (lookupObject === undefined) {
        return variantRef.value;
      }
      return lookupObject[variantRef.value as TestVariant];
    });

    return {
      variant,
      onAct,
    };
  }

  /**
   * Vue 3 Composable for Feature Flags
   */
  function useFeatureFlag(flagName: FlagName): ComputedRef<boolean> {
    const val = abby.getFeatureFlag(flagName);
    return computed(() => Boolean(val));
  }

  /**
   * Vue 3 Composable for Remote Config with strict key-to-type derivation
   */
  function useRemoteConfig<
    T extends RemoteConfigName,
    Config extends RemoteConfig[T],
  >(remoteConfigName: T): ComputedRef<RemoteConfigValueStringToType<Config>> {
    const val = abby.getRemoteConfig(remoteConfigName);
    return computed(() => val as RemoteConfigValueStringToType<Config>);
  }

  return {
    useAbby,
    useFeatureFlag,
    useRemoteConfig,
    __abby__: abby,
  };
}

export * from "./StorageService";
