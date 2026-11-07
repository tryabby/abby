import {
  type ABConfig,
  type Abby,
  type AbbyDataResponse,
  AbbyEventType,
  HttpService,
  type RemoteConfigValueString,
  type RemoteConfigValueStringToType,
  type validation,
} from "@tryabby/core";
import {
  type App,
  type ComputedRef,
  type InjectionKey,
  type PropType,
  computed,
  defineComponent,
  inject,
  onMounted,
  onUnmounted,
  provide,
  shallowRef,
} from "vue";
import { TestStorageService } from "./StorageService";
import { serializeUserProperties } from "./helpers";

export type ABTestReturnValue<Lookup, TestVariant> = Lookup extends undefined
  ? TestVariant
  : TestVariant extends keyof Lookup
    ? Lookup[TestVariant]
    : never;

export interface AbbyProviderServerData {
  __abby__data?: AbbyDataResponse | null;
  __abby_cookie?: string | null;
}

// Reactive state container synchronizing core Abby store updates into Vue reactivity refs.
interface ReactiveAbbyController<
  FlagName extends string,
  TestName extends string,
  Tests extends Record<string, ABConfig>,
  RemoteConfig extends Record<RemoteConfigName, RemoteConfigValueString>,
  RemoteConfigName extends Extract<keyof RemoteConfig, string>,
  Environments extends Array<string>,
  User extends Record<string, validation.ValidatorType>,
> {
  abby: Abby<
    FlagName,
    TestName,
    Tests,
    RemoteConfig,
    RemoteConfigName,
    Environments,
    User
  >;
  version: ReturnType<typeof shallowRef<number>>;
  projectId: string;
  apiUrl?: string;
}

// Synchronizes user properties into the core Abby instance whenever their serialized fingerprint changes.
function syncUserPropertiesIfChanged(
  abby: { updateUserProperties: (user: any) => void },
  state: { user?: Record<string, unknown>; lastHash: string }
): string {
  if (!state.user) return state.lastHash;
  const nextHash = serializeUserProperties(state.user);
  if (nextHash !== state.lastHash) {
    abby.updateUserProperties(state.user);
  }
  return nextHash;
}

// Hydrates Abby state on the server or client using preloaded SSR payload or remote API fetch.
async function hydrateControllerData(
  controller: {
    abby: {
      init: (data: AbbyDataResponse) => unknown;
      loadProjectData: () => Promise<unknown>;
    };
    version: { value: number };
  },
  serverValue?: AbbyProviderServerData | null
): Promise<void> {
  if (serverValue?.__abby__data) {
    controller.abby.init(serverValue.__abby__data);
  } else {
    await controller.abby.loadProjectData();
  }
  controller.version.value += 1;
}

// Initializes SSR or client-side project data on provider mount and subscribes to core updates.
function createProviderComponent<
  FlagName extends string,
  TestName extends string,
  Tests extends Record<string, ABConfig>,
  RemoteConfig extends Record<RemoteConfigName, RemoteConfigValueString>,
  RemoteConfigName extends Extract<keyof RemoteConfig, string>,
  Environments extends Array<string>,
  User extends Record<string, validation.ValidatorType>,
>(
  controller: ReactiveAbbyController<
    FlagName,
    TestName,
    Tests,
    RemoteConfig,
    RemoteConfigName,
    Environments,
    User
  >,
  injectionKey: InjectionKey<typeof controller>
) {
  return defineComponent({
    name: "AbbyProvider",
    props: {
      value: {
        type: Object as PropType<AbbyProviderServerData | null>,
        default: null,
      },
      user: {
        type: Object as PropType<{
          -readonly [K in keyof User]: validation.Infer<User[K]>;
        }>,
        default: undefined,
      },
    },
    setup(props, { slots }) {
      provide(injectionKey, controller);

      let lastHash = syncUserPropertiesIfChanged(controller.abby, {
        user: props.user as Record<string, unknown> | undefined,
        lastHash: "",
      });

      if (typeof window === "undefined" && props.value?.__abby__data) {
        controller.abby.init(props.value.__abby__data);
        controller.abby.setLocalOverrides(props.value.__abby_cookie ?? "");
      }

      let unsubscribe: (() => void) | undefined;

      onMounted(async () => {
        unsubscribe = controller.abby.subscribe(() => {
          controller.version.value += 1;
        });
        await hydrateControllerData(controller, props.value);
      });

      onUnmounted(() => {
        unsubscribe?.();
      });

      return () => {
        lastHash = syncUserPropertiesIfChanged(controller.abby, {
          user: props.user as Record<string, unknown> | undefined,
          lastHash,
        });
        return slots.default?.() ?? null;
      };
    },
  });
}

// Emits an Abby telemetry event (PING on composable evaluation or ACT on conversion).
function emitAbbyEvent(
  controller: { projectId: string; apiUrl?: string },
  payload: { type: AbbyEventType; testName: string; selectedVariant: string }
): void {
  if (!payload.testName || !payload.selectedVariant) return;
  HttpService.sendData({
    url: controller.apiUrl,
    type: payload.type,
    data: {
      projectId: controller.projectId,
      selectedVariant: payload.selectedVariant,
      testName: payload.testName,
    },
  });
}

// Constructs the Vue 3 provider component, Vue plugin installer, and typed reactive composables.
export function createAbbyContext<
  const FlagName extends string,
  const TestName extends string,
  const Tests extends Record<string, ABConfig>,
  const RemoteConfig extends Record<RemoteConfigName, RemoteConfigValueString>,
  const RemoteConfigName extends Extract<keyof RemoteConfig, string>,
  const Environments extends Array<string> = Array<string>,
  const User extends Record<string, validation.ValidatorType> = Record<
    string,
    validation.ValidatorType
  >,
>(
  abby: Abby<
    FlagName,
    TestName,
    Tests,
    RemoteConfig,
    RemoteConfigName,
    Environments,
    User
  >,
  meta: { projectId: string; apiUrl?: string }
) {
  const version = shallowRef(0);
  abby.subscribe(() => {
    version.value += 1;
  });

  const controller: ReactiveAbbyController<
    FlagName,
    TestName,
    Tests,
    RemoteConfig,
    RemoteConfigName,
    Environments,
    User
  > = {
    abby,
    version,
    projectId: meta.projectId,
    apiUrl: meta.apiUrl,
  };

  const injectionKey: InjectionKey<typeof controller> = Symbol("AbbyContext");
  const AbbyProvider = createProviderComponent(controller, injectionKey);

  const resolveController = () => inject(injectionKey, controller);

  const AbbyPlugin = {
    install(app: App) {
      app.provide(injectionKey, controller);
      app.component("AbbyProvider", AbbyProvider);
    },
  };

  const useAbby = <
    TName extends keyof Tests,
    TestVariant extends Tests[TName]["variants"][number],
    LookupValue,
    const Lookup extends
      | Record<TestVariant, LookupValue>
      | undefined = undefined,
  >(
    testName: TName,
    lookupObject?: Lookup
  ): {
    variant: ComputedRef<ABTestReturnValue<Lookup, TestVariant>>;
    onAct: () => void;
  } => {
    const activeController = resolveController();
    const initialVariant = activeController.abby.getTestVariant(testName);

    emitAbbyEvent(activeController, {
      type: AbbyEventType.PING,
      testName: String(testName),
      selectedVariant: initialVariant,
    });

    const variant = computed<ABTestReturnValue<Lookup, TestVariant>>(() => {
      void activeController.version.value;
      const selected = activeController.abby.getTestVariant(testName);
      if (lookupObject === undefined) {
        return selected as ABTestReturnValue<Lookup, TestVariant>;
      }
      return lookupObject[
        selected as keyof typeof lookupObject
      ] as ABTestReturnValue<Lookup, TestVariant>;
    });

    const onAct = () => {
      const currentVariant = activeController.abby.getTestVariant(testName);
      emitAbbyEvent(activeController, {
        type: AbbyEventType.ACT,
        testName: String(testName),
        selectedVariant: currentVariant,
      });
    };

    return { variant, onAct };
  };

  const useFeatureFlag = (flagName: FlagName): ComputedRef<boolean> => {
    const activeController = resolveController();
    return computed(() => {
      void activeController.version.value;
      return activeController.abby.getFeatureFlag(flagName);
    });
  };

  const useFeatureFlags = (): ComputedRef<
    Array<{ name: FlagName; value: boolean }>
  > => {
    const activeController = resolveController();
    return computed(() => {
      void activeController.version.value;
      const flags = activeController.abby.getProjectData().flags;
      return Object.entries(flags).map(([name, data]) => ({
        name: name as FlagName,
        value: (data as { value: boolean }).value,
      }));
    });
  };

  const useRemoteConfig = <
    T extends RemoteConfigName,
    Config extends RemoteConfig[T] = RemoteConfig[T],
  >(
    remoteConfigName: T
  ): ComputedRef<RemoteConfigValueStringToType<Config>> => {
    const activeController = resolveController();
    return computed(() => {
      void activeController.version.value;
      return activeController.abby.getRemoteConfig(remoteConfigName);
    });
  };

  const useRemoteConfigVariables = (): ComputedRef<
    Array<{
      name: RemoteConfigName;
      value: RemoteConfigValueStringToType<RemoteConfig[RemoteConfigName]>;
    }>
  > => {
    const activeController = resolveController();
    return computed(() => {
      void activeController.version.value;
      const rc = activeController.abby.getProjectData().remoteConfig;
      return Object.entries(rc).map(([name, data]) => ({
        name: name as RemoteConfigName,
        value: (
          data as {
            value: RemoteConfigValueStringToType<
              RemoteConfig[RemoteConfigName]
            >;
          }
        ).value,
      }));
    });
  };

  return {
    AbbyProvider,
    AbbyPlugin,
    useAbby,
    useFeatureFlag,
    useFeatureFlags,
    useRemoteConfig,
    useRemoteConfigVariables,
    getABTestValue: <
      TName extends keyof Tests,
      TestVariant extends Tests[TName]["variants"][number],
      LookupValue,
      const Lookup extends
        | Record<TestVariant, LookupValue>
        | undefined = undefined,
    >(
      testName: TName,
      lookupObject?: Lookup
    ): ABTestReturnValue<Lookup, TestVariant> => {
      const selected = abby.getTestVariant(testName);
      if (lookupObject === undefined) {
        return selected as ABTestReturnValue<Lookup, TestVariant>;
      }
      return lookupObject[
        selected as keyof typeof lookupObject
      ] as ABTestReturnValue<Lookup, TestVariant>;
    },
    getFeatureFlagValue: (flagName: FlagName) => abby.getFeatureFlag(flagName),
    getRemoteConfig: <
      T extends RemoteConfigName,
      Config extends RemoteConfig[T] = RemoteConfig[T],
    >(
      remoteConfigName: T
    ): RemoteConfigValueStringToType<Config> =>
      abby.getRemoteConfig(remoteConfigName),
    getVariants: <T extends keyof Tests>(
      testName: T
    ): Tests[T]["variants"][number][] => abby.getVariants(testName),
    getABResetFunction: <T extends keyof Tests>(testName: T) => {
      return () => {
        TestStorageService.remove({
          projectId: meta.projectId,
          key: String(testName),
        });
      };
    },
    setUserProperties: (user: {
      -readonly [K in keyof User]: validation.Infer<User[K]>;
    }) => abby.updateUserProperties(user),
    __abby__: abby,
  };
}
