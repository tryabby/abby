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

/**
 * Creates project-scoped cookie storage that is safe to access during SSR.
 * @param projectId - Project identifier used to namespace cookie keys.
 * @param keyFor - Builds the cookie key for a project and entry name.
 * @returns Storage methods that read and write cookies only in the browser.
 */
function cookieStorage(
  projectId: string,
  keyFor: (projectId: string, name: string) => string
) {
  return {
    /**
     * Reads a persisted value from its project-scoped cookie.
     * @param name - Test, feature flag, or remote-config entry name.
     * @returns The cookie value, or null if unavailable or rendering on the server.
     */
    get(name: string): string | null {
      if (typeof document === "undefined") return null;
      return Cookie.get(keyFor(projectId, name)) ?? null;
    },
    /**
     * Persists an entry in a browser cookie; does nothing during SSR.
     * @param name - Test, feature flag, or remote-config entry name.
     * @param value - Serialized value to persist.
     * @param options - Optional cookie expiration settings; defaults to 365 days.
     * @returns Nothing.
     */
    set(name: string, value: string, options?: StorageServiceOptions): void {
      if (typeof document === "undefined") return;
      Cookie.set(keyFor(projectId, name), value, {
        expires: options?.expiresInDays ?? 365,
      });
    },
  };
}

/**
 * Creates a typed Vue integration with a provider and project-specific composables.
 * Each provider owns a separate Core client to avoid sharing mutable SSR state.
 * @param abbyConfig - Project configuration, including tests, flags, and config types.
 * @returns The provider, typed composables, and a composable for the Core client.
 */
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

  /**
   * Creates an isolated Core client with copied mutable configuration and cookies.
   * @returns A new client for one provider instance.
   */
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

  /**
   * Provides an isolated Abby client to descendants and loads project data on mount.
   * The initialData prop optionally supplies server-loaded project data.
   */
  const AbbyProvider = defineComponent({
    name: "AbbyProvider",
    props: {
      initialData: Object as PropType<AbbyDataResponse>,
    },
    emits: ["error"],
    /**
     * Initializes provider state, subscriptions, and client-side data loading.
     * @param props - Provider props containing optional initial project data.
     * @param context - Vue setup context containing the error emitter and slots.
     * @param context.emit - Emits project-loading errors to the parent.
     * @param context.slots - Descendant content rendered within the provider.
     * @returns A render function for the default slot.
     */
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

  /**
   * Resolves the context belonging to this integration's nearest provider.
   * @returns The provider's client and reactive lifecycle state.
   * @throws When called outside the matching AbbyProvider.
   */
  const useContext = (): Context => {
    const context = inject(injectionKey, null);
    if (!context) {
      throw new Error(
        "Abby composables must be used inside this createAbby's AbbyProvider."
      );
    }
    return context;
  };

  /**
   * Tracks a test variant and exposes an action callback for conversion events.
   * The variant is empty until client mount and project-data initialization finish.
   * @param name - Configured A/B test name.
   * @param lookup - Optional mapping from every variant to a typed display value.
   * @returns A computed variant or mapped value, plus the onAct event callback.
   */
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

    /**
     * Sends an analytics event only after a nonempty variant has been selected.
     * @param type - Analytics event kind, such as PING or ACT.
     * @returns Nothing; the HTTP request is dispatched without awaiting completion.
     */
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
      /**
       * Records an action for the currently selected variant.
       * @returns Nothing; no event is sent before a variant is available.
       */
      onAct: () => send(AbbyEventType.ACT),
    };
  };

  /**
   * Reads a feature flag reactively from the matching provider's Core client.
   * @param name - Configured feature-flag name.
   * @returns A computed boolean that updates when the Core client notifies listeners.
   */
  const useFeatureFlag = (name: FlagName): ComputedRef<boolean> => {
    const context = useContext();
    return computed(() => {
      context.revision.value;
      return context.client.getFeatureFlag(name);
    });
  };

  /**
   * Reads a remote-config value reactively while preserving its configured type.
   * @param name - Configured remote-config entry name.
   * @returns A computed value typed according to the entry's configured value kind.
   */
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
    /**
     * Exposes the Core client owned by the matching provider.
     * @returns The provider-scoped Abby client for imperative updates.
     * @throws When called outside the matching AbbyProvider.
     */
    useAbbyClient: () => useContext().client,
  };
}
