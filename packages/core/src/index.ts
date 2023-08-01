import {
  ABBY_AB_STORAGE_PREFIX,
  ABBY_FF_STORAGE_PREFIX,
  AbbyDataResponse,
  FlagValue,
  FlagValueString,
  FlagValueStringToType,
  flagStringToType,
  getDefaultFlagValue,
  stringifyFlagValue,
} from "./shared/";
import { HttpService } from "./shared";
import { F } from "ts-toolbelt";
import { getWeightedRandomVariant } from "./mathHelpers";
import { parseCookies } from "./helpers";

export * from "./shared/index";
export { defineConfig } from "./defineConfig";

export type ABConfig<T extends string = string> = {
  variants: ReadonlyArray<T>;
};

type Settings<
  FlagName extends string,
  Flags extends Record<FlagName, FlagValueString> = Record<FlagName, FlagValueString>,
> = {
  flags?: {
    defaultValues?: {
      [K in FlagValueString]?: FlagValueStringToType<K>;
    };
    devOverrides?: {
      [K in keyof Flags]?: FlagValueStringToType<Flags[K]>;
    };
  };
};

type LocalData<FlagName extends string = string, TestName extends string = string> = {
  tests: Record<
    TestName,
    ABConfig & {
      weights?: Array<number>;
      selectedVariant?: string;
    }
  >;
  flags: Record<FlagName, FlagValue>;
};

interface PersistentStorage {
  get: (key: string) => string | null;
  set: (key: string, value: string) => void;
}

export type AbbyConfig<
  FlagName extends string = string,
  Tests extends Record<string, ABConfig> = Record<string, ABConfig>,
  Flags extends Record<FlagName, FlagValueString> = Record<FlagName, FlagValueString>,
  Environments extends Array<string> = Array<string>,
> = {
  projectId: string;
  apiUrl?: string;
  currentEnvironment?: Environments[number];
  environments: Environments;
  tests?: Tests;
  flags?: Flags;
  settings?: Settings<F.NoInfer<FlagName>, Flags>;
  debug?: boolean;
};

export class Abby<
  FlagName extends string,
  TestName extends string,
  Tests extends Record<string, ABConfig>,
  Flags extends Record<FlagName, FlagValueString>,
  Environments extends Array<string> = Array<string>,
> {
  private log = (...args: any[]) =>
    this.config.debug ? console.log(`core.Abby`, ...args) : () => {};

  #data: LocalData<FlagName, TestName> = {
    tests: {} as any,
    flags: {} as any,
  };

  private listeners = new Set<(newData: LocalData<FlagName, TestName>) => void>();

  private _cfg: AbbyConfig<FlagName, Tests, Flags>;

  private dataInitialized: Boolean = false;

  private flagOverrides = new Map<string, FlagValueStringToType<Flags[keyof Flags]>>();

  private testOverrides: Map<keyof Tests, Tests[keyof Tests]["variants"][number]> = new Map();

  constructor(
    private config: F.Narrow<AbbyConfig<FlagName, Tests, Flags, Environments>>,
    private persistantTestStorage?: PersistentStorage,
    private persistantFlagStorage?: PersistentStorage
  ) {
    this._cfg = config as AbbyConfig<FlagName, Tests, Flags, Environments>;
    this.#data.flags = Object.keys(config.flags ?? {}).reduce(
      (acc, flagName) => {
        acc[flagName as FlagName] = this.getDefaultFlagValue(
          flagName as FlagName,
          config.flags as any
        );
        return acc;
      },
      {} as Record<FlagName, FlagValue>
    );
    this.#data.tests = config.tests ?? ({} as any);
  }

  /**
   * Helper function to load the projects data from the A/BBY API
   * and init the local data
   */
  async loadProjectData() {
    this.log(`loadProjectData()`);

    const data = await HttpService.getProjectData({
      projectId: this.config.projectId,
      environment: this.config.currentEnvironment as string,
      url: this.config.apiUrl,
    });
    if (!data) {
      this.log(`loadProjectData() => no data`);
      return;
    }
    this.init(data);
  }

  async getProjectDataAsync(): Promise<LocalData<FlagName, TestName>> {
    this.log(`getProjectDataAsync()`);

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
  private responseToLocalData<FlagName extends string, TestName extends string>(
    data: AbbyDataResponse
  ): LocalData<FlagName, TestName> {
    return {
      tests: data.tests.reduce(
        (acc, { name, weights }) => {
          if (!acc[name as keyof Tests]) {
            return acc;
          }

          // assigned the fetched weights to the initial config
          acc[name as keyof Tests] = {
            ...acc[name as keyof Tests],
            weights,
          };
          return acc;
        },
        (this.config.tests ?? {}) as any
      ),
      flags: data.flags.reduce(
        (acc, { name, value }) => {
          acc[name] = value;
          return acc;
        },
        {} as Record<string, FlagValue>
      ),
    };
  }

  /**
   * Function to get the locally stored information about A/B tests and feature flags
   * This also includes the overrides from the dev tools and the local overrides
   * @returns the local data
   */
  getProjectData(): LocalData<FlagName, TestName> {
    this.log(`getProjectData()`);

    return {
      tests: Object.entries(this.#data.tests).reduce((acc, [testName, test]) => {
        acc[testName as TestName] = {
          ...(test as Tests[TestName]),
          selectedVariant: this.getTestVariant(testName as TestName),
        };
        return acc;
      }, this.#data.tests),
      flags: Object.keys(this.#data.flags).reduce((acc, flagName) => {
        acc[flagName as FlagName] = this.getFeatureFlag(flagName as FlagName);
        return acc;
      }, this.#data.flags),
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
    this.log(`init()`, data);

    this.#data = this.responseToLocalData(data);
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
  getFeatureFlag<T extends keyof Flags, CurrentFlag extends Flags[T] = Flags[T]>(
    key: T
  ): FlagValueStringToType<CurrentFlag> {
    this.log(`getFeatureFlag()`, key);

    const storedValue = this.#data.flags[key as unknown as FlagName];

    const localOverride = this.flagOverrides?.get(key as unknown as FlagName);

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
      const devOverride = (this.config.settings?.flags?.devOverrides as any)?.[key];
      if (devOverride != null) {
        return devOverride;
      }
    }

    const flagType = this._cfg.flags?.[key];
    const defaultValue = this._cfg.settings?.flags?.defaultValues?.[flagType!];

    // return the defaultValue if exists
    if (!storedValue && defaultValue != null) {
      return defaultValue;
    }

    this.log(`getFeatureFlag() => storedValue:`, storedValue);
    return storedValue as FlagValueStringToType<CurrentFlag>;
  }

  /**
   * Function to get the value of a test variant. This includes
   * the overrides from the dev tools and the local overrides if in development mode
   * if there is no override or a stored variant we generate a new one and store it
   * @param key The name of the test
   * @returns the value of the test variant
   */
  getTestVariant<T extends keyof Tests>(key: T): Tests[T]["variants"][number] {
    this.log(`getTestVariant()`, key);

    const { variants, weights } = (this.#data.tests as LocalData["tests"])[
      key as keyof LocalData["tests"]
    ];

    const override = this.testOverrides.get(key);

    if (process.env.NODE_ENV === "development" && override != null) {
      return override;
    }

    const persistedValue = this.persistantTestStorage?.get(key as string);

    if (persistedValue != null) {
      this.log(`getTestVariant() => persistedValue:`, persistedValue);

      return persistedValue;
    }

    const weightedVariant = getWeightedRandomVariant(variants, weights);
    this.persistantTestStorage?.set(key as string, weightedVariant);

    this.log(`getTestVariant() => weightedVariant:`, weightedVariant);

    return weightedVariant;
  }

  /**
   * Helper function update the locally stored variant for a test
   * @param key the name of the test
   * @param override the value to override the test variant with
   */
  updateLocalVariant<T extends keyof Tests>(key: T, override: Tests[T]["variants"][number]) {
    this.testOverrides.set(key, override);
    this.persistantTestStorage?.set(key as string, override);

    this.notifyListeners();
  }

  /**
   * Helper function to update the locally stored value of a feature flag
   * @param name the name of the feature flag
   * @param value the value to override the feature flag with
   */
  updateFlag<F extends FlagName>(name: F, value: FlagValueStringToType<Flags[F]>) {
    this.flagOverrides.set(name, value);
    if (process.env.NODE_ENV === "development") {
      this.persistantFlagStorage?.set(name, this.stringifiedFlagValue(value));
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

        this.testOverrides.set(testName as TestName, cookieValue);
      }
      // FF testing cookie
      if (cookieName.startsWith(ABBY_FF_STORAGE_PREFIX)) {
        const flagName = cookieName.replace(
          `${ABBY_FF_STORAGE_PREFIX}${this.config.projectId}_`,
          ""
        );

        this.flagOverrides.set(flagName, this.flagStringToType(flagName, cookieValue) as any);
      }
    });
  }

  private getDefaultFlagValue<FlagName extends string>(flagName: FlagName, flags: Flags) {
    const flagType = flags[flagName as unknown as keyof Flags];

    const defaultValue = (this.config.settings?.flags?.defaultValues as any)?.[flagName] as
      | FlagValue
      | undefined;

    if (defaultValue != null) return defaultValue;

    return getDefaultFlagValue(flagType);
  }

  private flagStringToType(flagName: string, stringifiedValue: string): FlagValue {
    const flagType = this._cfg.flags?.[flagName as keyof Flags]!;

    return flagStringToType({
      stringifiedValue,
      flagType,
    });
  }

  private stringifiedFlagValue(value: FlagValue): string {
    return stringifyFlagValue(value);
  }
}
