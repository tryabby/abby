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
  type ValidatorType,
  getABStorageKey,
  getFFStorageKey,
  getRCStorageKey,
} from "@tryabby/core";
import Cookie from "js-cookie";
import {
  type ComputedRef,
  type InjectionKey,
  type PropType,
  type Ref,
  computed,
  defineComponent,
  inject,
  onMounted,
  onScopeDispose,
  provide,
  ref,
  watch,
} from "vue";

export { type ABConfig, type AbbyConfig, defineConfig } from "@tryabby/core";

export type ABTestReturnValue<Lookup, Variant> = Lookup extends undefined
  ? Variant
  : Variant extends keyof Lookup
    ? Lookup[Variant]
    : never;

function cookieStorage(
  projectId: string,
  keyFor: (projectId: string, name: string) => string
) {
  return {
    get(name: string): string | null {
      if (typeof document === "undefined") return null;
      return Cookie.get(keyFor(projectId, name)) ?? null;
    },
    set(name: string, value: string, options?: StorageServiceOptions): void {
      if (typeof document === "undefined") return;
      Cookie.set(keyFor(projectId, name), value, {
        expires: options?.expiresInDays ?? 365,
      });
    },
  };
}

export function createAbby<
  const FlagName extends string,
  const TestName extends string,
  const Tests extends Record<TestName, ABConfig>,
  const RemoteConfig extends Record<string, RemoteConfigValueString>,
  const User extends Record<string, ValidatorType> = Record<
    string,
    ValidatorType
  >,
>(
  abbyConfig: AbbyConfig<
    FlagName,
    Tests,
    string[],
    Extract<keyof RemoteConfig, string>,
    RemoteConfig,
    User
  >
) {
  type RemoteConfigName = Extract<keyof RemoteConfig, string>;
  type Client = Abby<
    FlagName,
    TestName,
    Tests,
    RemoteConfig,
    RemoteConfigName,
    string[],
    User
  >;
  type Context = {
    client: Client;
    revision: Ref<number>;
    mounted: Ref<boolean>;
    ready: Ref<boolean>;
  };

  const injectionKey: InjectionKey<Context> = Symbol("tryabby-vue");

  const createClient = (): Client => {
    // Core enriches tests with weights and can change cookie consent. Each
    // provider gets a fresh config so Vue SSR requests cannot leak state.
    const config = {
      ...abbyConfig,
      tests: abbyConfig.tests
        ? (Object.fromEntries(
            (Object.entries(abbyConfig.tests) as Array<[string, ABConfig]>).map(
              ([name, test]) => [
                name,
                { ...test, variants: [...test.variants] },
              ]
            )
          ) as unknown as Tests)
        : undefined,
      flags: abbyConfig.flags ? [...abbyConfig.flags] : undefined,
      remoteConfig: abbyConfig.remoteConfig
        ? { ...abbyConfig.remoteConfig }
        : undefined,
      cookies: abbyConfig.cookies ? { ...abbyConfig.cookies } : undefined,
    } as AbbyConfig<
      FlagName,
      Tests,
      string[],
      RemoteConfigName,
      RemoteConfig,
      User
    >;

    return new Abby<
      FlagName,
      TestName,
      Tests,
      RemoteConfig,
      RemoteConfigName,
      string[],
      User
    >(
      config,
      cookieStorage(config.projectId, getABStorageKey),
      cookieStorage(config.projectId, getFFStorageKey),
      cookieStorage(config.projectId, getRCStorageKey)
    );
  };

  const AbbyProvider = defineComponent({
    name: "AbbyProvider",
    props: {
      initialData: Object as PropType<AbbyDataResponse>,
    },
    emits: ["error"],
    setup(props, { emit, slots }) {
      const client = createClient();
      const revision = ref(0);
      const mounted = ref(false);
      const ready = ref(false);

      if (props.initialData) {
        client.init(props.initialData);
        ready.value = true;
      }

      const unsubscribe = client.subscribe(() => {
        revision.value += 1;
      });
      onScopeDispose(unsubscribe);
      provide(injectionKey, { client, revision, mounted, ready });

      onMounted(async () => {
        mounted.value = true;
        if (props.initialData) return;

        try {
          await client.loadProjectData();
        } catch (error) {
          emit("error", error);
        } finally {
          ready.value = true;
          revision.value += 1;
        }
      });

      return () => slots.default?.();
    },
  });

  const useContext = (): Context => {
    const context = inject(injectionKey, null);
    if (!context) {
      throw new Error(
        "Abby composables must be used inside this createAbby's AbbyProvider."
      );
    }
    return context;
  };

  const useAbby = <
    Name extends keyof Tests,
    Variant extends Tests[Name]["variants"][number],
    LookupValue,
    const Lookup extends Record<Variant, LookupValue> | undefined = undefined,
  >(
    name: Name,
    lookup?: Lookup
  ): {
    variant: ComputedRef<ABTestReturnValue<Lookup, Variant>>;
    onAct: () => void;
  } => {
    const context = useContext();
    const selected = computed<Variant | "">(() => {
      context.revision.value;
      if (!context.mounted.value || !context.ready.value) return "";
      return context.client.getTestVariant(name) as Variant;
    });

    const send = (type: AbbyEventType): void => {
      if (!selected.value) return;
      void HttpService.sendData({
        url: abbyConfig.apiUrl,
        type,
        data: {
          projectId: abbyConfig.projectId,
          testName: name as string,
          selectedVariant: selected.value,
        },
      });
    };

    watch(
      selected,
      (variant, previous) => {
        if (variant && variant !== previous) send(AbbyEventType.PING);
      },
      { flush: "post" }
    );

    const variant = computed(() => {
      if (!selected.value) return "";
      return lookup === undefined
        ? selected.value
        : lookup[selected.value as Variant];
    }) as ComputedRef<ABTestReturnValue<Lookup, Variant>>;

    return {
      variant,
      onAct: () => send(AbbyEventType.ACT),
    };
  };

  const useFeatureFlag = (name: FlagName): ComputedRef<boolean> => {
    const context = useContext();
    return computed(() => {
      context.revision.value;
      return context.client.getFeatureFlag(name);
    });
  };

  const useRemoteConfig = <Name extends RemoteConfigName>(
    name: Name
  ): ComputedRef<RemoteConfigValueStringToType<RemoteConfig[Name]>> => {
    const context = useContext();
    return computed(() => {
      context.revision.value;
      return context.client.getRemoteConfig(name);
    });
  };

  return {
    AbbyProvider,
    useAbby,
    useFeatureFlag,
    useRemoteConfig,
    useAbbyClient: () => useContext().client,
  };
}
