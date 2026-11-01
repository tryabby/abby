import {
  type ABConfig,
  Abby,
  type AbbyConfig,
  type AbbyDataResponse,
  AbbyEventType,
  HttpService,
  type RemoteConfigValueString,
  type RemoteConfigValueStringToType,
  type StorageServiceOptions,
  getABStorageKey,
  getFFStorageKey,
  getRCStorageKey,
} from "@tryabby/core";
import Cookie from "js-cookie";
import {
  type ComputedRef,
  type InjectionKey,
  type MaybeRefOrGetter,
  type PropType,
  computed,
  defineComponent,
  inject,
  onMounted,
  onScopeDispose,
  provide,
  shallowRef,
  toValue,
  watch,
} from "vue";

export { type ABConfig, type AbbyConfig, defineConfig } from "@tryabby/core";

export type ABTestReturnValue<Lookup, Variant> = Lookup extends undefined
  ? Variant
  : Variant extends keyof Lookup
    ? Lookup[Variant]
    : never;

export function createAbby<
  const FlagName extends string,
  const TestName extends string,
  const Tests extends Record<TestName, ABConfig>,
  const RemoteConfig extends Record<RemoteConfigName, RemoteConfigValueString>,
  const RemoteConfigName extends Extract<keyof RemoteConfig, string>,
>(
  config: AbbyConfig<FlagName, Tests, string[], RemoteConfigName, RemoteConfig>
) {
  type Client = Abby<FlagName, TestName, Tests, RemoteConfig, RemoteConfigName>;
  type Context = {
    client: Client;
    revision: { value: number };
    ready: ComputedRef<boolean>;
  };
  const key: InjectionKey<Context> = Symbol("abby");

  const storage = (makeKey: (project: string, name: string) => string) => ({
    get: (name: string) =>
      typeof document === "undefined"
        ? null
        : (Cookie.get(makeKey(config.projectId, name)) ?? null),
    set: (name: string, value: string, options?: StorageServiceOptions) => {
      if (typeof document === "undefined") return;
      Cookie.set(makeKey(config.projectId, name), value, {
        expires: options?.expiresInDays ?? config.cookies?.expiresInDays ?? 365,
        sameSite: "lax",
      });
    },
  });

  const AbbyProvider = defineComponent({
    name: "AbbyProvider",
    props: {
      initialData: Object as PropType<AbbyDataResponse>,
    },
    emits: ["error"],
    setup(props, { slots, emit }) {
      // Core adds weights and cookie-consent state to its config; do not share that across requests.
      const localConfig = {
        ...config,
        tests: Object.fromEntries(
          (Object.entries(config.tests ?? {}) as Array<[string, ABConfig]>).map(
            ([name, test]) => [name, { ...test, variants: [...test.variants] }]
          )
        ) as unknown as Tests,
        flags: config.flags ? [...config.flags] : undefined,
        remoteConfig: config.remoteConfig
          ? { ...config.remoteConfig }
          : undefined,
        cookies: config.cookies ? { ...config.cookies } : undefined,
      };
      const client = new Abby<
        FlagName,
        TestName,
        Tests,
        RemoteConfig,
        RemoteConfigName
      >(
        localConfig,
        storage(getABStorageKey),
        storage(getFFStorageKey),
        storage(getRCStorageKey)
      );
      const revision = shallowRef(0);
      const mounted = shallowRef(false);
      const loaded = shallowRef(Boolean(props.initialData));
      if (props.initialData) client.init(props.initialData, false);
      const unsubscribe = client.subscribe(() => {
        revision.value += 1;
      });
      onScopeDispose(unsubscribe);
      provide(key, {
        client,
        revision,
        ready: computed(() => mounted.value && loaded.value),
      });
      onMounted(async () => {
        mounted.value = true;
        try {
          if (typeof document !== "undefined")
            client.setLocalOverrides(document.cookie);
        } catch (error) {
          emit("error", error);
        }
        revision.value += 1;
        if (props.initialData) return;
        try {
          await client.loadProjectData();
          loaded.value = true;
        } catch (error) {
          emit("error", error);
        }
      });
      return () => slots.default?.();
    },
  });

  const context = () => {
    const value = inject(key, null);
    if (!value)
      throw new Error(
        "Abby composables must be used inside this createAbby's AbbyProvider."
      );
    return value;
  };

  const useAbby = <
    Name extends keyof Tests,
    const Lookup extends
      | Record<Tests[Name]["variants"][number], unknown>
      | undefined = undefined,
  >(
    name: MaybeRefOrGetter<Name>,
    lookup?: Lookup
  ) => {
    const state = context();
    const selected = computed(() => {
      state.revision.value;
      return state.ready.value
        ? state.client.getTestVariant(toValue(name))
        : undefined;
    });
    const notify = (type: AbbyEventType) => {
      if (selected.value === undefined) return;
      return HttpService.sendData({
        url: config.apiUrl,
        type,
        data: {
          projectId: config.projectId,
          testName: String(toValue(name)),
          selectedVariant: selected.value,
        },
      });
    };
    watch(
      [() => toValue(name), selected],
      () => {
        notify(AbbyEventType.PING);
      },
      { immediate: true, flush: "post" }
    );
    const variant = computed(() => {
      const value = selected.value;
      if (value === undefined) return undefined;
      return (lookup ? lookup[value] : value) as ABTestReturnValue<
        Lookup,
        Tests[Name]["variants"][number]
      >;
    });
    return { variant, onAct: () => notify(AbbyEventType.ACT) };
  };

  const useFeatureFlag = (name: MaybeRefOrGetter<FlagName>) => {
    const state = context();
    return computed(() => {
      state.revision.value;
      return state.client.getFeatureFlag(toValue(name));
    });
  };

  const useRemoteConfig = <Name extends RemoteConfigName>(
    name: MaybeRefOrGetter<Name>
  ) => {
    const state = context();
    return computed(() => {
      state.revision.value;
      return state.client.getRemoteConfig(
        toValue(name)
      ) as RemoteConfigValueStringToType<RemoteConfig[Name]>;
    });
  };

  return {
    AbbyProvider,
    useAbby,
    useFeatureFlag,
    useRemoteConfig,
    useAbbyClient: () => context().client,
    useAbbyStatus: () => context().ready,
  };
}
