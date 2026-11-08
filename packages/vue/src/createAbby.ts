import {
  Abby,
  type ABConfig,
  type AbbyConfig,
  AbbyEventType,
  HttpService,
  type RemoteConfigValueString,
  type RemoteConfigValueStringToType,
  type ValidatorType,
} from "@tryabby/core";
import { computed, shallowRef, type ComputedRef } from "vue";
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
  const User extends Record<string, ValidatorType> = Record<string, ValidatorType>,
>(
  config: AbbyConfig<
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
    config,
    {
      get: (key) =>
        typeof window === "undefined"
          ? null
          : TestStorageService.get(config.projectId, key),
      set: (key, value) => {
        if (typeof window === "undefined" || config.cookies?.disableByDefault) return;
        TestStorageService.set(config.projectId, key, value, {
          expiresInDays: config.cookies?.expiresInDays,
        });
      },
    },
    {
      get: (key) =>
        typeof window === "undefined"
          ? null
          : FlagStorageService.get(config.projectId, key),
      set: (key, value) => {
        if (typeof window === "undefined") return;
        FlagStorageService.set(config.projectId, key, value);
      },
    },
    {
      get: (key) =>
        typeof window === "undefined"
          ? null
          : RemoteConfigStorageService.get(config.projectId, key),
      set: (key, value) => {
        if (typeof window === "undefined") return;
        RemoteConfigStorageService.set(config.projectId, key, value);
      },
    }
  );

  type ProjectData = ReturnType<typeof abby.getProjectData>;
  const data = shallowRef<ProjectData>(abby.getProjectData());
  let loadPromise: Promise<unknown> | undefined;

  const sync = (next: ProjectData) => {
    data.value = next;
  };

  abby.subscribe(sync);

  const ensureLoaded = () => {
    if (typeof window === "undefined") return;
    if (!loadPromise) {
      loadPromise = abby.loadProjectData().then((next) => {
        if (next) sync(next as ProjectData);
      });
    }
  };

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
    ensureLoaded();

    const rawVariant = computed(
      () =>
        data.value.tests[name as unknown as TestName]?.selectedVariant ??
        abby.getTestVariant(name)
    );

    const variant = computed(() => {
      const selected = rawVariant.value as TestVariant;
      return (
        lookupObject
          ? lookupObject[selected]
          : selected
      ) as ABTestReturnValue<Lookup, TestVariant>;
    });

    const onAct = () => {
      const selectedVariant = rawVariant.value;
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
    };

    return { variant, onAct };
  };

  const useFeatureFlag = (name: FlagName): ComputedRef<boolean> => {
    ensureLoaded();
    return computed(() => data.value.flags[name]?.value ?? abby.getFeatureFlag(name));
  };

  const useRemoteConfig = <T extends RemoteConfigName>(
    name: T
  ): ComputedRef<RemoteConfigValueStringToType<RemoteConfig[T]>> => {
    ensureLoaded();
    return computed(
      () =>
        (data.value.remoteConfig[name]?.value ??
          abby.getRemoteConfig(name)) as RemoteConfigValueStringToType<RemoteConfig[T]>
    );
  };

  return {
    useAbby,
    useFeatureFlag,
    useRemoteConfig,
    __abby__: abby,
  };
}
