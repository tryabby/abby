import { Inject, Injectable } from "@angular/core";
import type { Route } from "@angular/router";
import type {
  RemoteConfigValue,
  RemoteConfigValueString,
  RemoteConfigValueStringToType,
} from "@tryabby/core";
import {
  type ABConfig,
  Abby,
  type AbbyConfig,
  AbbyEventType,
  HttpService,
} from "@tryabby/core";
import {
  type Observable,
  Subject,
  from,
  map,
  merge,
  of,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from "rxjs";
import {
  FlagStorageService,
  RemoteConfigStorageService,
  TestStorageService,
} from "./StorageService";
import type { AbbyLoggerService } from "./abby-logger.service";

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

export type InferFlagNames<C extends AbbyConfig> = InferFlags<C>[number];
export type InferTestNames<C extends AbbyConfig> = InferTests<C> extends Record<
  infer T,
  any
>
  ? T
  : never;
export type InferTests<C extends AbbyConfig> = NonNullable<C["tests"]>;
export type InferFlags<C extends AbbyConfig> = NonNullable<C["flags"]>;
export type InferRemoteConfig<C extends AbbyConfig> = NonNullable<
  C["remoteConfig"]
>;
export type InferRemoteConfigName<C extends AbbyConfig> = keyof NonNullable<
  C["remoteConfig"]
>;

type PossibleFlagName<FlagName extends string> = FlagName | `!${FlagName}`;

@Injectable({ providedIn: "root" })
export class AbbyService<
  const FlagName extends string = string,
  const TestName extends string = string,
  const Tests extends Record<TestName, ABConfig> = Record<TestName, ABConfig>,
  const RemoteConfig extends Record<
    RemoteConfigName,
    RemoteConfigValueString
  > = Record<string, RemoteConfigValueString>,
  const RemoteConfigName extends Extract<keyof RemoteConfig, string> = Extract<
    keyof RemoteConfig,
    string
  >,
> {
  private abby: Abby<FlagName, TestName, Tests, RemoteConfig, RemoteConfigName>;

  private selectedVariants: { [key: string]: string } = {};

  private config: AbbyConfig<
    FlagName,
    Tests,
    string[],
    RemoteConfigName,
    RemoteConfig
  >;

  private projectData$?: Observable<LocalData<FlagName, TestName>>;

  private cookieChanged$ = new Subject<void>();

  constructor(
    @Inject(AbbyService)
    config: AbbyConfig<
      FlagName,
      Tests,
      string[],
      RemoteConfigName,
      RemoteConfig
    >,
    private abbyLogger: AbbyLoggerService
  ) {
    this.abby = new Abby(
      config,
      {
        get: (key: string) => {
          if (typeof window === "undefined") return null;
          return TestStorageService.get(config.projectId, key);
        },
        set: (key: string, value: any) => {
          if (typeof window === "undefined") return;
          TestStorageService.set(config.projectId, key, value);
          this.cookieChanged$.next();
        },
      },
      {
        get: (key: string) => {
          if (typeof window === "undefined") return null;
          return FlagStorageService.get(config.projectId, key);
        },
        set: (key: string, value: any) => {
          if (typeof window === "undefined") return;
          FlagStorageService.set(config.projectId, key, value);
          this.cookieChanged$.next();
        },
      },
      {
        get: (key: string) => {
          if (typeof window === "undefined") return null;
          return RemoteConfigStorageService.get(config.projectId, key);
        },
        set: (key: string, value: any) => {
          if (typeof window === "undefined") return;
          RemoteConfigStorageService.set(config.projectId, key, value);
          this.cookieChanged$.next();
        },
      }
    );

    this.config = config;
  }

  public init(): Observable<void> {
    return this.resolveData().pipe(map(() => void 0));
  }

  public getVariant<T extends keyof Tests>(testName: T): Observable<string> {
    this.abbyLogger.log(`getVariant(${testName as string})`);

    return this.resolveData().pipe(
      map((_data) => this.abby.getTestVariant(testName)),
      // biome-ignore lint/suspicious/noAssignInExpressions:>
      tap((variant) => (this.selectedVariants[testName as string] = variant)),
      tap((variant) =>
        this.abbyLogger.log(`getVariant(${testName as string}) =>`, variant)
      ),
      shareReplay(1)
    );
  }

  public onAct(testName: string): void {
    this.abbyLogger.log(`onAct(${testName})`);

    if (!this.selectedVariants[testName]) return;

    this.abbyLogger.log({
      url: this.config.apiUrl,
      type: AbbyEventType.ACT,
      data: {
        projectId: this.config.projectId,
        selectedVariant: this.selectedVariants[testName],
        testName: testName,
      },
    });

    HttpService.sendData({
      url: this.config.apiUrl,
      type: AbbyEventType.ACT,
      data: {
        projectId: this.config.projectId,
        selectedVariant: this.selectedVariants[testName],
        testName: testName,
      },
    });
  }

  public getFeatureFlagValue<F extends PossibleFlagName<FlagName>>(
    name: F
  ): Observable<boolean> {
    const isFeatureFlagInverted = name.startsWith("!");
    const strippedFlagName = isFeatureFlagInverted
      ? (name.slice(1) as FlagName)
      : (name as FlagName);

    this.abbyLogger.log(
      `getFeatureFlagValue(${name}) -> ${this.abby.getFeatureFlag(strippedFlagName)}`
    );

    return this.resolveData().pipe(
      map(() => this.abby.getFeatureFlag(strippedFlagName)),
      tap((value) =>
        this.abbyLogger.log(`getFeatureFlagValue(${name}) =>`, value)
      ),
      map((featureFlagValue) => {
        return (
          (!featureFlagValue && isFeatureFlagInverted) ||
          (featureFlagValue && !isFeatureFlagInverted)
        );
      }),
      shareReplay(1)
    );
  }

  public getRemoteConfig<T extends RemoteConfigName>(
    name: T
  ): Observable<RemoteConfigValueStringToType<RemoteConfig[T]>> {
    return this.resolveData().pipe(
      map(() => this.abby.getRemoteConfig(name)),
      tap((value) =>
        this.abbyLogger.log(`getRemoteConfig(${name}) => ${value}`)
      )
    );
  }

  private resolveData(): Observable<LocalData<FlagName, TestName>> {
    this.projectData$ ??= from(this.abby.getProjectDataAsync()).pipe(
      switchMap((data) => {
        const initialData$ = of(data); // Create an observable with the initial data

        return merge(this.cookieChanged$, initialData$).pipe(
          switchMap(() => from(this.abby.getProjectDataAsync())),
          startWith(data) // Ensure that the initial data is emitted first
        );
      }),
      shareReplay(1)
    );
    return this.projectData$;
  }

  public getAbbyInstance(): Abby<
    FlagName,
    TestName,
    Tests,
    RemoteConfig,
    RemoteConfigName
  > {
    return this.abby;
  }

  public getRouterVariant(
    test: string,
    baseRoute: Route & {
      abbyVariants: Record<string, Pick<Route, "component" | "title">>;
    }
  ): Route {
    return {
      ...baseRoute,
      ...baseRoute.abbyVariants[test],
    };
  }

  public getVariants = <T extends keyof Tests>(name: T) => {
    return this.resolveData().pipe(map((_data) => this.abby.getVariants(name)));
  };

  public resetAB = <T extends keyof Tests>(name: T) => {
    TestStorageService.remove(this.config.projectId, name as string);
  };
}
