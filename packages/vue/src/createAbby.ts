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
import type { Infer } from "@tryabby/core/validation";
import {
  type App,
  type ComputedRef,
  type InjectionKey,
  type Ref,
  computed,
  getCurrentInstance,
  getCurrentScope,
  inject,
  onMounted,
  onScopeDispose,
  shallowRef,
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

/**
 * Injection key used by the `AbbyProvider` plugin to expose the underlying
 * Abby instance to nested components via `useAbbyInstance`.
 */
export const ABBY_INJECTION_KEY: InjectionKey<unknown> = Symbol("abby");

const isBrowser = typeof window !== "undefined";

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
      get: (key: string) => {
        if (!isBrowser) return null;
        return TestStorageService.get(config.projectId, key);
      },
      set: (key: string, value: string) => {
        if (!isBrowser || config.cookies?.disableByDefault) return;
        TestStorageService.set(config.projectId, key, value);
      },
    },
    {
      get: (key: string) => {
        if (!isBrowser) return null;
        return FlagStorageService.get(config.projectId, key);
      },
      set: (key: string, value: string) => {
        if (!isBrowser || config.cookies?.disableByDefault) return;
        FlagStorageService.set(config.projectId, key, value);
      },
    },
    {
      get: (key: string) => {
        if (!isBrowser) return null;
        return RemoteConfigStorageService.get(config.projectId, key);
      },
      set: (key: string, value: string) => {
        if (!isBrowser || config.cookies?.disableByDefault) return;
        RemoteConfigStorageService.set(config.projectId, key, value);
      },
    }
  );

  /**
   * Subscribes `listener` to Abby's data changes and automatically tears the
   * subscription down when the surrounding Vue effect scope (a component's
   * `setup`, an `effectScope`, ...) is disposed. On the server there is nothing
   * to react to, so this is a no-op.
   */
  const subscribeScoped = (listener: () => void) => {
    if (!isBrowser) return;
    const unsubscribe = abby.subscribe(() => listener());
    if (getCurrentScope()) {
      onScopeDispose(unsubscribe);
    }
    return unsubscribe;
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
    // Start with an empty variant so the server render and the first client
    // render are identical, which avoids hydration mismatches. The real
    // variant is resolved once we are safely on the client (on mount).
    const selectedVariant = shallowRef<string>("");

    const resolve = () => {
      selectedVariant.value = abby.getTestVariant(name);
    };

    if (isBrowser) {
      const activate = () => {
        resolve();
        if (!selectedVariant.value) return;
        HttpService.sendData({
          url: config.apiUrl,
          type: AbbyEventType.PING,
          data: {
            projectId: config.projectId,
            selectedVariant: selectedVariant.value,
            testName: name as string,
          },
        });
      };

      // Defer to `onMounted` inside components to keep hydration stable;
      // resolve immediately when the composable is used outside of a component.
      if (getCurrentInstance()) {
        onMounted(activate);
      } else {
        activate();
      }

      subscribeScoped(resolve);
    }

    const variant = computed(
      () =>
        (lookupObject
          ? lookupObject[selectedVariant.value as TestVariant]
          : selectedVariant.value) as ABTestReturnValue<Lookup, TestVariant>
    );

    /**
     * Notifies the server that the selected variant was acted upon
     * (e.g. a button using the variant was clicked).
     */
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

    return { variant, onAct };
  };

  const useFeatureFlag = (name: FlagName): Ref<boolean> => {
    const flag = shallowRef(abby.getFeatureFlag(name));
    subscribeScoped(() => {
      flag.value = abby.getFeatureFlag(name);
    });
    return flag;
  };

  const useRemoteConfig = <
    T extends RemoteConfigName,
    Config extends RemoteConfig[T],
  >(
    name: T
  ): Ref<RemoteConfigValueStringToType<Config>> => {
    const remoteConfig = shallowRef(abby.getRemoteConfig(name)) as Ref<
      RemoteConfigValueStringToType<Config>
    >;
    subscribeScoped(() => {
      remoteConfig.value = abby.getRemoteConfig(name);
    });
    return remoteConfig;
  };

  const getFeatureFlagValue = (name: FlagName) => abby.getFeatureFlag(name);

  const getRemoteConfig = <
    T extends RemoteConfigName,
    Config extends RemoteConfig[T],
  >(
    name: T
  ): RemoteConfigValueStringToType<Config> => abby.getRemoteConfig(name);

  const getABTestValue = <
    K extends keyof Tests,
    TestVariant extends Tests[K]["variants"][number],
    LookupValue,
    const Lookup extends
      | Record<TestVariant, LookupValue>
      | undefined = undefined,
  >(
    name: K,
    lookupObject?: Lookup
  ): ABTestReturnValue<Lookup, TestVariant> => {
    const variant = abby.getTestVariant(name);
    if (lookupObject === undefined) {
      return variant as ABTestReturnValue<Lookup, TestVariant>;
    }
    return lookupObject[variant as TestVariant] as ABTestReturnValue<
      Lookup,
      TestVariant
    >;
  };

  const getVariants = <K extends keyof Tests>(name: K) =>
    abby.getVariants(name);

  /**
   * Creates a function that resets the persisted variant for a given test.
   */
  const getABResetFunction = <K extends keyof Tests>(name: K) => {
    return () => {
      if (!isBrowser) return;
      TestStorageService.remove(config.projectId, name as string);
    };
  };

  const updateUserProperties = (
    user: Partial<{
      -readonly [K in keyof User]: Infer<User[K]>;
    }>
  ) => {
    abby.updateUserProperties(user);
  };

  /**
   * Loads the project data from the Abby API. Called automatically by the
   * `AbbyProvider` plugin in the browser and exposed for manual/SSR control.
   */
  const loadProjectData = () => abby.loadProjectData();

  /**
   * A Vue plugin that hydrates Abby with server data (when provided) or loads
   * it on the client, and exposes the instance through Vue's dependency
   * injection so nested components can reach it via `useAbbyInstance`.
   *
   * @example
   * app.use(AbbyProvider);
   * // or, for SSR, pass data fetched on the server:
   * app.use(AbbyProvider, { initialData });
   */
  const AbbyProvider = {
    install(app: App, options?: { initialData?: AbbyDataResponse }) {
      if (options?.initialData) {
        abby.init(options.initialData);
      } else if (isBrowser) {
        void abby.loadProjectData();
      }
      app.provide(ABBY_INJECTION_KEY, abby);
    },
  };

  /**
   * Returns the underlying Abby instance provided by `AbbyProvider`, falling
   * back to the instance created by this `createAbby` call.
   */
  const useAbbyInstance = () => inject(ABBY_INJECTION_KEY, abby) as typeof abby;

  return {
    useAbby,
    useFeatureFlag,
    useRemoteConfig,
    getFeatureFlagValue,
    getRemoteConfig,
    getABTestValue,
    getVariants,
    getABResetFunction,
    updateUserProperties,
    loadProjectData,
    AbbyProvider,
    useAbbyInstance,
    __abby__: abby,
  };
}
