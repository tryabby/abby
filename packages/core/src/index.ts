import { parseCookies } from "./helpers";
import {
  getVariantWithHeighestWeightOrFirst,
  getWeightedRandomVariant,
} from "./mathHelpers";
import {
  HttpService,
  hashStringToInt32,
  isSerializedAbbyDataResponse,
  parseAbbyData,
} from "./shared";
import {
  ABBY_AB_STORAGE_PREFIX,
  ABBY_FF_STORAGE_PREFIX,
  ABBY_RC_STORAGE_PREFIX,
  ABBY_WINDOW_KEY,
  type AbbyDataResponse,
  DEFAULT_FEATURE_FLAG_VALUE,
  type RemoteConfigValue,
  type RemoteConfigValueString,
  type RemoteConfigValueStringToType,
  type StorageServiceOptions,
  getDefaultRemoteConfigValue,
  remoteConfigStringToType,
  stringifyRemoteConfigValue,
} from "./shared/";

export * from "./shared/index";
export {
  defineConfig,
  type DynamicConfigKeys,
  DYNAMIC_ABBY_CONFIG_KEYS,
} from "./defineConfig";

export type ABConfig<T extends string = string> = {
  variants: ReadonlyArray<T>;
};

type Settings<
  FlagName extends string,
  RemoteConfigName extends string = string,
  RemoteConfig extends Record<
    RemoteConfigName,
    RemoteConfigValueString
  > = Record<RemoteConfigName, RemoteConfigValueString>,
> = {
  flags?: {
    defaultValue?: boolean;
    devOverrides?: {
      [K in FlagName]?: boolean;
    };
    fallbackValues?: {
      [K in FlagName]?: boolean;
    };
  };
  remoteConfig?: {
    defaultValues?: {
      [K in RemoteConfigValueString]?: RemoteConfigValueStringToType<K>;
    };
    devOverrides?: {
      [K in keyof RemoteConfig]: RemoteConfigValueStringToType<RemoteConfig[K]>;
    };
    fallbackValues?: {
      [K in keyof RemoteConfig]?: RemoteConfigValueStringToType<
        RemoteConfig[K]
      >;
    };
  };
};

type LocalData<
  FlagName extends string = string,
  TestName extends string = string,
  RemoteConfigName extends string = string,
> = {
  tests: Record<
    TestName,
    ABConfig & {
      weights?: Array<number>;
      selectedVariant?: string;
    }
  >;
  flags: Record<FlagName, boolean>;
  remoteConfig: Record<RemoteConfigName, RemoteConfigValue>;
};

interface PersistentStorage {
  get: (key: string) => string | null;
  set: (key: string, value: string, options?: StorageServiceOptions) => void;
}

export type AbbyConfig<
  FlagName extends string = string,
  Tests extends Record<string, ABConfig> = Record<string, ABConfig>,
  Environments extends Array<string> = Array<string>,
  RemoteConfigName extends string = string,
  RemoteConfig extends Record<
    RemoteConfigName,
    RemoteConfigValueString
  > = Record<RemoteConfigName, RemoteConfigValueString>,
> = {
  projectId: string;
  apiUrl?: string;
  currentEnvironment: Environments[number];
  environments: Environments;
  tests?: Tests;
  flags?: FlagName[];
  remoteConfig?: RemoteConfig;
  settings?: Settings<FlagName, RemoteConfigName, RemoteConfig>;
  debug?: boolean;
  fetch?: (typeof globalThis)["fetch"];
  cookies?: {
    disableByDefault?: boolean;
    expiresInDays?: number;
    disableInDevelopment?: boolean;
  };
  experimental?: {
    cdnUrl?: string;
    apiVersion?: "v1" | "v2";
  };
};

export class Abby<
  const FlagName extends string,
  const TestName extends string,
  const Tests extends Record<string, ABConfig>,
  const RemoteConfig extends Record<RemoteConfigName, RemoteConfigValueString>,
  const RemoteConfigName extends Extract<keyof RemoteConfig, string>,
  const Environments extends Array<string> = Array<string>,
> {
  private log = (...args: any[]) =>
    this.config.debug ? console.log("core.Abby", ...args) : () => {};

  #data: LocalData<FlagName, TestName, RemoteConfigName> = {
    tests: {} as any,
    flags: {} as any,
    remoteConfig: {} as any,
  };

  private listeners = new Set<
    (newData: LocalData<FlagName, TestName>) => void
  >();

  private dataInitialized = false;

  private flagOverrides = new Map<string, boolean>();
  private testOverrides: Map<
    keyof Tests,
    Tests[keyof Tests]["variants"][number]
  > = new Map();
  private remoteConfigOverrides = new Map<string, RemoteConfigValue>();

  private COOKIE_CONSENT_KEY = "$_abcc_$";

  constructor(
    private config: AbbyConfig<
      FlagName,
      Tests,
      Environments,
      RemoteConfigName,
      RemoteConfig
    >,
    private persistantTestStorage?: PersistentStorage,
    private persistantFlagStorage?: PersistentStorage,
    private persistentRemoteConfigStorage?: PersistentStorage
  ) {
    this.#data.flags = Object.values(this.config.flags ?? {}).reduce(
      (acc, flagName) => {
        const internalFlagName = this.__internal_getInternalName(flagName);
        acc[internalFlagName] = DEFAULT_FEATURE_FLAG_VALUE;
        return acc;
      },
      {} as Record<FlagName, boolean>
    );
    this.#data.tests = Object.keys(this.config.tests ?? {}).reduce(
      (acc, _testName) => {
        const testName = _testName as TestName;
        const internalTestName = this.__internal_getInternalName(testName);
        if (this.config.tests) {
          acc[internalTestName as TestName] =
            this.config.tests[testName as TestName];
        }
        return acc;
      },
      {} as Record<TestName, ABConfig>
    );
    this.#data.remoteConfig = Object.keys(config.remoteConfig ?? {}).reduce(
      (acc, _remoteConfigName) => {
        const remoteConfigName = _remoteConfigName as RemoteConfigName;
        const internalConfigName =
          this.__internal_getInternalName(remoteConfigName);

        acc[internalConfigName] = this.getDefaultRemoteConfigValue(
          remoteConfigName,
          config.remoteConfig as any
        );

        return acc;
      },
      {} as Record<RemoteConfigName, RemoteConfigValue>
    );
    if (persistantTestStorage) {
      this.persistantTestStorage = {
        get: (...args) => {
          const [key] = args;
          const humanReadableName = this.__internal_getNameMatch(
            key as TestName,
            "tests"
          );
          if (!humanReadableName) return null;
          return persistantTestStorage.get(humanReadableName as TestName);
        },
        set: (...args) => {
          if (!this.canUseCookies()) return;
          const [key, value] = args;
          const humanReadableName = this.__internal_getNameMatch(
            key as TestName,
            "tests"
          );
          if (!humanReadableName) return;
          persistantTestStorage.set(humanReadableName, value, {
            expiresInDays: config.cookies?.expiresInDays,
          });
        },
      };
    }
    if (persistantFlagStorage) {
      this.persistantFlagStorage = {
        get: (...args) => {
          const [key] = args;
          const humanReadableName = this.__internal_getNameMatch(
            key as FlagName,
            "flags"
          );
          if (!humanReadableName) return null;
          return persistantFlagStorage.get(humanReadableName);
        },
        set: (...args) => {
          if (!this.canUseCookies()) return;
          const [key, value] = args;
          const humanReadableName = this.__internal_getNameMatch(
            key as FlagName,
            "flags"
          );
          if (!humanReadableName) return;
          persistantFlagStorage.set(humanReadableName, value, {
            expiresInDays: config.cookies?.expiresInDays,
          });
        },
      };
    }
    if (persistentRemoteConfigStorage) {
      this.persistentRemoteConfigStorage = {
        get: (...args) => {
          const [key] = args;
          const humanReadableName = this.__internal_getNameMatch(
            key as RemoteConfigName,
            "remoteConfig"
          );
          if (!humanReadableName) return null;
          return persistentRemoteConfigStorage.get(humanReadableName);
        },
        set: (...args) => {
          if (!this.canUseCookies()) return;
          const [key, value] = args;
          const humanReadableName = this.__internal_getNameMatch(
            key as RemoteConfigName,
            "remoteConfig"
          );
          if (!humanReadableName) return;
          persistentRemoteConfigStorage.set(humanReadableName, value, {
            expiresInDays: config.cookies?.expiresInDays,
          });
        },
      };
    }
  }

  /**
   * Helper function to load the projects data from the Abby API
   * and init the local data
   */
  async loadProjectData() {
    this.log("loadProjectData()");
    const start = Date.now();

    // browser environments can load the abby data from the window object
    // when the script is loaded from the server
    if (
      typeof window !== "undefined" &&
      ABBY_WINDOW_KEY in window &&
      window[ABBY_WINDOW_KEY] != null
    ) {
      this.log("loadProjectData() => using window data");
      return this.init(window[ABBY_WINDOW_KEY] as AbbyDataResponse);
    }
    const data = await HttpService.getProjectData({
      projectId: this.config.projectId,
      environment: this.config.currentEnvironment as string,
      url: this.config.apiUrl,
      fetch: this.config.fetch,
      experimental: {
        cdnUrl: this.config.experimental?.cdnUrl
          ? `${this.config.experimental?.cdnUrl}/${this.config.projectId}/${this.config.currentEnvironment}`
          : undefined,
        apiVersion: this.config.experimental?.apiVersion,
      },
    });
    if (!data) {
      this.log("loadProjectData() => no data");
      return;
    }
    this.log("loadProjectData() => finished. Elapsed: ", Date.now() - start);
    return this.init(data);
  }

  async getProjectDataAsync(): Promise<
    LocalData<FlagName, TestName, RemoteConfigName>
  > {
    this.log("getProjectDataAsync()");

    if (!this.dataInitialized) {
      await this.loadProjectData();
      this.dataInitialized = true;
    }
    return this.getProjectData();
  }

  /**
   * Helper function to transform the data which is fetched from the server
   * to the local data structure
   */
  private responseToLocalData(
    res: AbbyDataResponse
  ): LocalData<FlagName, TestName> {
    const data = isSerializedAbbyDataResponse(res) ? parseAbbyData(res) : res;
    return {
      tests: data.tests.reduce(
        (acc, { name: _name, weights }) => {
          const name = _name as TestName;
          const currentTest = this.#data.tests[name];
          // assigned the fetched weights to the initial config
          acc[name] = {
            ...currentTest,
            // this could be potentially undefined
            variants: currentTest?.variants ?? [],
            weights,
          };
          return acc;
        },
        Object.entries(this.#data.tests).reduce(
          (acc, cur) => {
            const [name, test] = cur;
            acc[this.__internal_getInternalName(name as TestName)] =
              test as ABConfig;
            return acc;
          },
          {} as Record<TestName, ABConfig>
        ) as Record<TestName, ABConfig>
      ),
      flags: data.flags.reduce(
        (acc, { name: _name, value }) => {
          const name = _name as FlagName;
          acc[name] = value;
          return acc;
        },
        Object.entries(this.#data.tests).reduce(
          (acc, cur) => {
            const [name, value] = cur;
            acc[this.__internal_getInternalName(name as FlagName)] =
              value as boolean;
            return acc;
          },
          {} as Record<FlagName, boolean>
        ) as Record<FlagName, boolean>
      ),
      remoteConfig: (data.remoteConfig ?? []).reduce(
        (acc, { name: _name, value }) => {
          const name = _name as RemoteConfigName;
          acc[name] = value;
          return acc;
        },
        Object.entries(this.#data.tests).reduce(
          (acc, cur) => {
            const [name, value] = cur;
            acc[this.__internal_getInternalName(name as RemoteConfigName)] =
              value as RemoteConfigValue;
            return acc;
          },
          {} as Record<RemoteConfigName, RemoteConfigValue>
        ) as Record<RemoteConfigName, RemoteConfigValue>
      ),
    };
  }

  /**
   * Function to get the locally stored information about A/B tests, feature flags and remote config
   * This also includes the overrides from the dev tools and the local overrides
   * @returns the local data
   */
  getProjectData(): LocalData<FlagName, TestName, RemoteConfigName> {
    return {
      tests: Object.entries(this.#data.tests).reduce(
        (acc, [_testName, test]) => {
          const testName = _testName as TestName;
          const currentTest = test as Tests[TestName];
          acc[testName] = {
            ...currentTest,
            selectedVariant: this.__internal_getTestVariant(testName),
            variants: currentTest?.variants ?? [],
          };
          return acc;
        },
        {} as Record<TestName, ABConfig>
      ),
      flags: Object.keys(this.#data.flags).reduce(
        (acc, _flagName) => {
          const flagName = _flagName as FlagName;

          acc[flagName] = this.__internal_getFeatureFlag(flagName);
          return acc;
        },
        {} as Record<FlagName, boolean>
      ),
      remoteConfig: Object.keys(this.#data.remoteConfig).reduce(
        (acc, _remoteConfigName) => {
          const remoteConfigName = _remoteConfigName as RemoteConfigName;
          acc[remoteConfigName] =
            this.__internal_getRemoteConfig(remoteConfigName);
          return acc;
        },
        {} as Record<RemoteConfigName, RemoteConfigValue>
      ),
    };
  }

  /**
   * Function to init the local data with the data from the server as well as
   * potentially setting the local overrides which are read from document.cookie if
   * we are in a browser environment
   * @param data
   * @returns
   */
  init(data: AbbyDataResponse) {
    this.log("init()", data);

    this.#data = this.responseToLocalData(data);
    this.log("init() => data", this.#data);
    this.notifyListeners();

    if (typeof window !== "undefined" && typeof document !== "undefined") {
      this.setLocalOverrides(document.cookie);
    }

    return this.getProjectData();
  }

  /**
   * Function to get the value of a feature flag. This includes
   * the overrides from the dev tools and the local overrides if in development mode
   * otherwise it will return the value retrieved from the server
   * @param key the name of the feature flag
   * @returns the value of the feature flag
   */

  getFeatureFlag(key: FlagName): boolean {
    return this.__internal_getFeatureFlag(this.__internal_getInternalName(key));
  }
  private __internal_getFeatureFlag(key: FlagName): boolean {
    this.log("getFeatureFlag()", key);

    const storedValue = this.#data.flags[key];

    const localOverride = this.flagOverrides?.get(key);

    if (localOverride != null) {
      return localOverride;
    }

    /**
     * in development mode, we can override the flag values
     * in the following priority
     * 1. DevTools
     * 2. DevOverrides from config
     * 3. DevDefault from config
     */
    if (process.env.NODE_ENV === "development") {
      const devOverride = this.config.settings?.flags?.devOverrides?.[key];
      if (devOverride != null) {
        return devOverride;
      }
    }

    const defaultValue = this.config.settings?.flags?.defaultValue;

    if (storedValue !== undefined) {
      this.log("getFeatureFlag() => storedValue:", storedValue);
      return storedValue;
    }
    // before we return the default value we check if there is a fallback value set
    const hasFallbackValue =
      key in (this.config.settings?.flags?.fallbackValues ?? {});

    if (hasFallbackValue) {
      const fallbackValue = this.config.settings?.flags?.fallbackValues?.[key];
      if (fallbackValue !== undefined) {
        if (typeof fallbackValue === "boolean") {
          this.log("getFeatureFlag() => fallbackValue:", fallbackValue);
          return fallbackValue;
        }
        const envFallbackValue =
          fallbackValue[this.config.currentEnvironment as string];

        if (envFallbackValue !== undefined) {
          this.log("getFeatureFlag() => envFallbackValue:", envFallbackValue);
          return envFallbackValue;
        }
      }
    }

    this.log("getFeatureFlag() => defaultValue:", defaultValue ?? false);
    return defaultValue ?? false;
  }

  /**
   * Function to get the value of a remote config. This includes
   * the overrides from the dev tools and the local overrides if in development mode
   * otherwise it will return the value retrieved from the server
   * @param key the name of the remote config
   * @returns the value of the remote config
   */

  getRemoteConfig<T extends RemoteConfigName>(
    key: T
  ): RemoteConfigValueStringToType<RemoteConfig[T]> {
    return this.__internal_getRemoteConfig(key);
  }

  private __internal_getRemoteConfig<T extends RemoteConfigName>(
    key: T
  ): RemoteConfigValueStringToType<RemoteConfig[T]> {
    this.log("getRemoteConfig()", key);

    const storedValue = this.#data.remoteConfig[key];
    const localOverride = this.remoteConfigOverrides?.get(key);

    if (localOverride !== undefined) {
      return localOverride as RemoteConfigValueStringToType<
        RemoteConfig[RemoteConfigName]
      >;
    }

    if (process.env.NODE_ENV === "development") {
      const devOverride = (
        this.config.settings?.remoteConfig?.devOverrides as any
      )?.[key];
      if (devOverride != null) {
        return devOverride;
      }
    }

    const defaultValue = this.config.remoteConfig?.[key]
      ? this.config.settings?.remoteConfig?.defaultValues?.[
          this.config.remoteConfig?.[key]
        ]
      : null;

    if (storedValue === undefined) {
      // before we return the default value we check if there is a fallback value set
      const fallbackValue =
        key in (this.config.settings?.remoteConfig?.fallbackValues ?? {});
      if (fallbackValue) {
        return this.config.settings?.remoteConfig?.fallbackValues?.[
          key
        ] as RemoteConfigValueStringToType<RemoteConfig[RemoteConfigName]>;
      }

      if (defaultValue != null) {
        return defaultValue as RemoteConfigValueStringToType<
          RemoteConfig[RemoteConfigName]
        >;
      }
    }

    this.log("getRemoteConfig() => storedValue:", storedValue);
    return storedValue as RemoteConfigValueStringToType<
      RemoteConfig[RemoteConfigName]
    >;
  }

  /**
   * Function to get the value of a test variant. This includes
   * the overrides from the dev tools and the local overrides if in development mode
   * if there is no override or a stored variant we generate a new one and store it
   * @param key The name of the test
   * @returns the value of the test variant
   */
  getTestVariant<T extends TestName>(key: T): Tests[T]["variants"][number] {
    return this.__internal_getTestVariant(this.__internal_getInternalName(key));
  }

  private __internal_getTestVariant<T extends TestName>(
    key: T
  ): Tests[T]["variants"][number] {
    const { variants, weights } = this.#data.tests[key];

    const override = this.testOverrides.get(key);

    if (process.env.NODE_ENV === "development" && override != null) {
      return override;
    }

    const persistedValue = this.persistantTestStorage?.get(key);

    if (persistedValue != null) {
      this.log("getTestVariant() => persistedValue:", persistedValue);

      return persistedValue;
    }
    if (this.config.cookies?.disableByDefault) {
      return getVariantWithHeighestWeightOrFirst(variants, weights);
    }
    const weightedVariant = getWeightedRandomVariant(variants, weights);
    this.persistantTestStorage?.set(key, weightedVariant);

    this.log("getTestVariant() => weightedVariant:", weightedVariant);

    return weightedVariant;
  }

  /**
   * Helper function update the locally stored variant for a test
   * @param key the name of the test
   * @param override the value to override the test variant with
   */
  updateLocalVariant<T extends TestName>(
    key: T,
    override: Tests[T]["variants"][number]
  ) {
    this.testOverrides.set(key, override);
    this.persistantTestStorage?.set(key, override);

    this.notifyListeners();
  }

  /**
   * Helper function to update the locally stored value of a feature flag
   * @param name the name of the feature flag
   * @param value the value to override the feature flag with
   */
  updateFlag(name: FlagName, value: boolean) {
    this.flagOverrides.set(name, value);
    if (process.env.NODE_ENV === "development") {
      this.persistantFlagStorage?.set(name, this.stringifiedValue(value));
    }
    this.notifyListeners();
  }

  /**
   * Helper function to update the locally stored value of a remote config
   * @param name the name of the remote config
   * @param value the value to override the remote config with
   */
  updateRemoteConfig<T extends RemoteConfigName>(
    name: RemoteConfigName,
    value: RemoteConfigValueStringToType<RemoteConfig[T]>
  ) {
    this.remoteConfigOverrides.set(name, value);
    if (process.env.NODE_ENV === "development") {
      this.persistentRemoteConfigStorage?.set(
        name,
        this.stringifiedValue(value)
      );
    }
    this.notifyListeners();
  }

  /**
   * Function to subscribe to changes in the local data
   * @param listener the function to call when the local data changes
   * @returns the unsubscribe function
   */
  subscribe(listener: (newValue: LocalData<FlagName, TestName>) => void) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Function to notify all listeners that the local data has changed
   */
  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.getProjectData()));
  }

  /**
   * Function to get the config passed to the Abby class
   */
  getConfig() {
    return this.config;
  }

  /**
   * Function to get all variants for a test
   */
  getVariants<T extends keyof Tests>(testName: T): Tests[T]["variants"] {
    return this.#data.tests[testName as unknown as TestName].variants;
  }

  /**
   * Function to initially set the local overrides from the cookies
   * this can be either a cookie from `document.cookie` or a cookie header.
   * This should be called after the init function
   * @param cookies the cookie string
   */
  setLocalOverrides(cookies: string) {
    const parsedCookies = parseCookies(cookies);
    Object.entries(parsedCookies).forEach(([cookieName, cookieValue]) => {
      // this happens if there are multiple abby instances. We only want to use the cookies for this instance
      if (!cookieName.includes(`${this.config.projectId}_`)) {
        return;
      }

      if (cookieName.startsWith(ABBY_AB_STORAGE_PREFIX)) {
        // A/B testing cookie
        const testName = cookieName.replace(
          `${ABBY_AB_STORAGE_PREFIX}${this.config.projectId}_`,
          ""
        );

        // special case for the cookie consent
        if (testName === this.COOKIE_CONSENT_KEY) {
          this.config.cookies ??= {};
          this.config.cookies.disableByDefault = cookieValue !== "true";
          return;
        }

        this.testOverrides.set(
          this.__internal_getInternalName(testName as TestName),
          cookieValue
        );
        this.persistantTestStorage?.set(testName as TestName, cookieValue);
      }
      // FF testing cookie
      if (cookieName.startsWith(ABBY_FF_STORAGE_PREFIX)) {
        const flagName = cookieName.replace(
          `${ABBY_FF_STORAGE_PREFIX}${this.config.projectId}_`,
          ""
        );

        const flagValue = cookieValue === "true";
        this.flagOverrides.set(
          this.__internal_getInternalName(flagName as FlagName),
          flagValue
        );
      }

      if (
        cookieName.startsWith(ABBY_RC_STORAGE_PREFIX) &&
        this.config.remoteConfig
      ) {
        const remoteConfigName = cookieName.replace(
          `${ABBY_RC_STORAGE_PREFIX}${this.config.projectId}_`,
          ""
        );

        const remoteConfigValue = remoteConfigStringToType({
          remoteConfigType:
            this.config.remoteConfig[remoteConfigName as RemoteConfigName],
          stringifiedValue: cookieValue,
        });
        this.remoteConfigOverrides.set(
          this.__internal_getInternalName(remoteConfigName as RemoteConfigName),
          remoteConfigValue
        );
      }
    });
  }

  private getDefaultRemoteConfigValue<RemoteConfigName extends string>(
    remoteConfigName: RemoteConfigName,
    remoteConfig: RemoteConfig
  ): RemoteConfigValue {
    const remoteConfigType =
      remoteConfig[remoteConfigName as unknown as keyof RemoteConfig];

    const defaultValue =
      this.config.settings?.remoteConfig?.defaultValues?.[remoteConfigType];

    if (defaultValue !== undefined) {
      return defaultValue as RemoteConfigValue;
    }

    return getDefaultRemoteConfigValue(remoteConfigType);
  }

  private stringifiedValue(value: RemoteConfigValue | boolean): string {
    if (typeof value === "boolean") {
      return value.toString();
    }
    return stringifyRemoteConfigValue(value);
  }

  /**
   * Retruns an Array of all flags with their name and value
   */
  getFeatureFlags() {
    return (Object.keys(this.#data.flags) as Array<FlagName>).map(
      (flagName) => ({
        name: this.__internal_getNameMatch(flagName, "flags"),
        value: this.getFeatureFlag(flagName),
      })
    );
  }

  /**
   * Retruns an Array of all remote config variables with their name and value
   */
  getRemoteConfigVariables() {
    return (
      Object.keys(this.#data.remoteConfig) as Array<RemoteConfigName>
    ).map((configName) => ({
      name: this.__internal_getNameMatch(configName, "remoteConfig"),
      value: this.getRemoteConfig(configName),
    })) as Array<{
      name: RemoteConfigName;
      value: RemoteConfigValueStringToType<RemoteConfig[RemoteConfigName]>;
    }>;
  }

  /**
   * Enables the usage of cookies for the storage of user data
   * and also sets the cookies if possible
   */
  enableCookies() {
    this.config.cookies ??= {};
    this.config.cookies.disableByDefault = false;
    this.persistantTestStorage?.set(this.COOKIE_CONSENT_KEY, "true");

    Object.keys(this.#data.tests).forEach((_testName) => {
      const testName = _testName as TestName;
      this.persistantTestStorage?.set(
        this.__internal_getInternalName(testName),
        this.__internal_getTestVariant(testName)
      );
    });
  }

  /**
   * Disables the usage of cookies for storage of user data
   * and also removes all set cookies if possible
   */
  disableCookies() {
    this.config.cookies ??= {};
    this.config.cookies.disableByDefault = true;
    this.persistantTestStorage?.set(this.COOKIE_CONSENT_KEY, "false");

    Object.keys(this.#data.tests).forEach((_testName) => {
      const testName = _testName as TestName;
      this.persistantTestStorage?.set(
        this.__internal_getInternalName(testName),
        this.__internal_getTestVariant(testName)
      );
    });
  }

  __internal_getInternalName<T extends FlagName | RemoteConfigName | TestName>(
    name: T
  ): T {
    return this.config.experimental?.apiVersion === "v2"
      ? (hashStringToInt32(name).toString() as T)
      : (name as T);
  }

  __internal_getNameMatch<T extends FlagName | RemoteConfigName | TestName>(
    name: T,
    type: keyof Pick<AbbyConfig, "flags" | "remoteConfig" | "tests">
  ) {
    switch (type) {
      case "flags":
        return this.config.flags?.find(
          (f) => this.__internal_getInternalName(f) === name
        );
      case "remoteConfig":
        return Object.keys(this.config.remoteConfig ?? {}).find(
          (c) => this.__internal_getInternalName(c as RemoteConfigName) === name
        );
      case "tests":
        return Object.keys(this.config.tests ?? {}).find(
          (t) => this.__internal_getInternalName(t as TestName) === name
        );
    }
  }

  private canUseCookies() {
    return (
      (process.env.NODE_ENV === "development" &&
        !this.config.cookies?.disableInDevelopment) ||
      !this.config.cookies?.disableByDefault
    );
  }
}
