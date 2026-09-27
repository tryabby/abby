import {
  ABBY_WINDOW_KEY,
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
  type DefineComponent,
  type InjectionKey,
  type PropType,
  computed,
  defineComponent,
  inject,
  onBeforeUnmount,
  onMounted,
  provide,
  shallowRef,
  watch,
} from "vue";
import {
  createStorage,
  getABStorageKey,
  getFFStorageKey,
  getRCStorageKey,
} from "./storage";

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
  const requiresCookieConsent = abbyConfig.cookies?.disableByDefault === true;
  // Core assigns weights and cookie preferences in place. A shared config
  // must not carry those mutations into another server request.
  const config = {
    ...abbyConfig,
    cookies: abbyConfig.cookies ? { ...abbyConfig.cookies } : undefined,
    tests: abbyConfig.tests
      ? (Object.fromEntries(
          Object.entries(abbyConfig.tests as Record<string, ABConfig>).map(
            ([name, test]) => [name, { ...test, variants: [...test.variants] }]
          )
        ) as unknown as Tests)
      : undefined,
  };
  const testStorage = createStorage(config.projectId, getABStorageKey);
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
    testStorage,
    createStorage(config.projectId, getFFStorageKey),
    createStorage(config.projectId, getRCStorageKey)
  );
  type ProjectData = ReturnType<typeof abby.getProjectData>;
  const createContext = () => ({
    data: shallowRef<ProjectData>(),
    mounted: shallowRef(false),
  });
  const contextKey: InjectionKey<ReturnType<typeof createContext>> =
    Symbol("Abby");

  function useContext() {
    const context = inject(contextKey, null);
    if (!context) {
      throw new Error(
        "Abby composables must be used inside the AbbyProvider returned by the same createAbby call."
      );
    }
    return context;
  }

  const AbbyProvider = defineComponent({
    name: "AbbyProvider",
    props: {
      initialData: Object as PropType<AbbyDataResponse>,
    },
    setup(props, { slots }) {
      const context = createContext();
      // Read saved consent before init notifies subscribers and selects tests.
      if (typeof document !== "undefined") {
        const consent = testStorage.get("$_abcc_$");
        if (consent !== null) {
          abby.setLocalOverrides(
            `${getABStorageKey(config.projectId, "$_abcc_$")}=${encodeURIComponent(consent)}`
          );
        } else if (requiresCookieConsent) {
          // A reused core instance may still hold the previous consent grant.
          abby.disableCookies();
        }
        abby.setLocalOverrides(document.cookie);
      }
      if (props.initialData) context.data.value = abby.init(props.initialData);
      provide(contextKey, context);
      let unsubscribe: (() => void) | undefined;
      onMounted(() => {
        context.mounted.value = true;
        unsubscribe = abby.subscribe(() => {
          context.data.value = abby.getProjectData();
        });
        if (props.initialData) {
          // Child mount hooks run first and may update targeting before we subscribe.
          context.data.value = abby.getProjectData();
          return;
        }
        // Select the first variant only after the server's weights arrive.
        // Fetch without init so a retired provider cannot overwrite a new one.
        const load =
          typeof window !== "undefined" &&
          ABBY_WINDOW_KEY in window &&
          window[ABBY_WINDOW_KEY] != null
            ? Promise.resolve(window[ABBY_WINDOW_KEY] as AbbyDataResponse)
            : HttpService.getProjectData({
                projectId: config.projectId,
                environment: config.currentEnvironment,
                url: config.apiUrl,
                fetch: config.fetch,
                __experimentalCdnUrl: config.__experimentalCdnUrl
                  ? `${config.__experimentalCdnUrl}/${config.projectId}/${config.currentEnvironment}`
                  : undefined,
              });
        void load.then((data) => {
          if (context.mounted.value) {
            context.data.value = data ? abby.init(data) : abby.getProjectData();
          }
        });
      });
      onBeforeUnmount(() => {
        context.mounted.value = false;
        unsubscribe?.();
      });
      return () => slots.default?.();
    },
  }) as DefineComponent<{ initialData?: AbbyDataResponse }>;

  function useAbby<
    K extends keyof Tests,
    Variant extends Tests[K]["variants"][number],
    const Lookup extends Record<Variant, unknown> | undefined = undefined,
  >(name: K, lookup?: Lookup) {
    const context = useContext();
    const mounted = shallowRef(false);
    onMounted(() => {
      mounted.value = true;
    });
    onBeforeUnmount(() => {
      mounted.value = false;
    });
    const selected = computed(() =>
      context.mounted.value && mounted.value
        ? context.data.value?.tests[name as unknown as TestName]
            ?.selectedVariant
        : undefined
    );
    function send(type: AbbyEventType) {
      if (!selected.value) return;
      HttpService.sendData({
        url: config.apiUrl,
        type,
        data: {
          projectId: config.projectId,
          testName: String(name),
          selectedVariant: selected.value,
        },
      });
    }
    watch(selected, (variant) => {
      if (variant) send(AbbyEventType.PING);
    });
    return {
      // undefined is explicit during SSR and the first client render.
      variant: computed<ABTestReturnValue<Lookup, Variant> | undefined>(() => {
        const variant = selected.value as Variant | undefined;
        if (variant === undefined) return undefined;
        return (lookup ? lookup[variant] : variant) as ABTestReturnValue<
          Lookup,
          Variant
        >;
      }),
      onAct: () => send(AbbyEventType.ACT),
    };
  }

  function useFeatureFlag(name: FlagName) {
    const context = useContext();
    return computed(() => {
      context.data.value;
      return abby.getFeatureFlag(name);
    });
  }

  function useRemoteConfig<K extends RemoteConfigName>(name: K) {
    const context = useContext();
    return computed<RemoteConfigValueStringToType<RemoteConfig[K]>>(() => {
      context.data.value;
      return abby.getRemoteConfig(name);
    });
  }

  function useFeatureFlags() {
    const context = useContext();
    return computed(() => {
      context.data.value;
      return abby.getFeatureFlags();
    });
  }

  function useRemoteConfigVariables() {
    const context = useContext();
    return computed(() => {
      context.data.value;
      return abby.getRemoteConfigVariables();
    });
  }

  function getABTestValue<
    K extends keyof Tests,
    Variant extends Tests[K]["variants"][number],
    const Lookup extends Record<Variant, unknown> | undefined = undefined,
  >(name: K, lookup?: Lookup): ABTestReturnValue<Lookup, Variant> {
    const variant = abby.getTestVariant(name) as Variant;
    return (lookup ? lookup[variant] : variant) as ABTestReturnValue<
      Lookup,
      Variant
    >;
  }

  function withDevtools<Props extends { abby: Abby<any, any, any, any, any> }>(
    factory: { create(props: Props): () => void },
    props: Omit<Props, "abby"> & { dangerouslyForceShow?: boolean }
  ): DefineComponent {
    return defineComponent({
      name: "AbbyDevtools",
      setup() {
        let destroy: (() => void) | undefined;
        onMounted(() => {
          if (
            !props.dangerouslyForceShow &&
            process.env.NODE_ENV !== "development"
          )
            return;
          const { dangerouslyForceShow: _force, ...options } = props;
          destroy = factory.create({ ...options, abby } as unknown as Props);
        });
        onBeforeUnmount(() => destroy?.());
        return () => null;
      },
    }) as DefineComponent;
  }

  return {
    AbbyProvider,
    useAbby,
    useFeatureFlag,
    useRemoteConfig,
    useFeatureFlags,
    useRemoteConfigVariables,
    getABTestValue,
    withDevtools,
    getFeatureFlagValue: abby.getFeatureFlag.bind(abby),
    getRemoteConfig: abby.getRemoteConfig.bind(abby),
    getVariants: abby.getVariants.bind(abby),
    getABResetFunction: (name: keyof Tests) => () =>
      testStorage.remove(String(name)),
    updateUserProperties: abby.updateUserProperties.bind(abby),
    __abby__: abby,
  };
}
