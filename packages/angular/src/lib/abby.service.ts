import { Inject, Injectable } from "@angular/core";
import { Route } from "@angular/router";
import { ExtractVariants } from "@tryabby/core";
import {
  Abby,
  AbbyConfig,
  AbbyEventType,
  ABConfig,
  FlagValue,
  FlagValueString,
  HttpService,
} from "@tryabby/core";
import {
  from,
  map,
  merge,
  Observable,
  of,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  tap,
} from "rxjs";
import { F } from "ts-toolbelt";
import { AbbyLoggerService } from "./abby-logger.service";
import { FlagStorageService, TestStorageService } from "./StorageService";

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

export type InferFlagNames<C extends AbbyConfig> = InferFlags<C> extends Record<infer F, any>
  ? F
  : never;
export type InferTestNames<C extends AbbyConfig> = InferTests<C> extends Record<infer T, any>
  ? T
  : never;
export type InferTests<C extends AbbyConfig> = NonNullable<C["tests"]>;
export type InferFlags<C extends AbbyConfig> = NonNullable<C["flags"]>;

type PossibleFlagName<FlagName extends string> = FlagName | `!${FlagName}`;

@Injectable({ providedIn: "root" })
export class AbbyService<
  FlagName extends string = string,
  TestName extends string = string,
  Tests extends Record<TestName, ABConfig> = Record<TestName, ABConfig>,
  Flags extends Record<FlagName, FlagValueString> = Record<FlagName, FlagValueString>,
> {
  private abby: Abby<FlagName, TestName, Tests, Flags>;

  private selectedVariants: { [key: string]: string } = {};

  private config: F.Narrow<AbbyConfig<FlagName, Tests, Flags>>;

  private projectData$?: Observable<LocalData<FlagName, TestName>>;

  private cookieChanged$ = new Subject<void>();

  constructor(
    @Inject(AbbyService) config: F.Narrow<AbbyConfig<FlagName, Tests, Flags>>,
    private abbyLogger: AbbyLoggerService
  ) {
    this.abby = new Abby<FlagName, TestName, Tests, Flags>(
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
      }
    );

    this.config = config;
  }

  public init(): Observable<void> {
    return this.resolveData().pipe(map(() => void 0));
  }

  public getVariant<T extends keyof Tests>(testName: T): Observable<string>;
  public getVariant<T extends keyof Tests, S>(
    testName: T,
    lookupObject: { [key in ExtractVariants<T, Tests>]: S } | undefined
  ): Observable<S>;
  public getVariant<T extends keyof Tests, S>(
    testName: T,
    lookupObject?: { [key in ExtractVariants<T, Tests>]: S } | undefined
  ): Observable<string | S> {
    this.abbyLogger.log(`getVariant(${testName as string})`);

    return this.resolveData().pipe(
      map((data) => this.abby.getTestVariant(testName)),
      tap((variant) => (this.selectedVariants[testName as string] = variant)),
      tap((variant) => this.abbyLogger.log(`getVariant(${testName as string}) =>`, variant)),
      map((variant) => {
        if (lookupObject === undefined) {
          return variant;
        }

        return lookupObject[variant];
      }),
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

  public getFeatureFlagValue<F extends PossibleFlagName<FlagName>>(name: F): Observable<boolean> {
    const isFeatureFlagInverted = name.startsWith("!");
    const strippedFlagName = isFeatureFlagInverted
      ? (name.slice(1) as FlagName)
      : (name as FlagName);

    this.abbyLogger.log(
      `getFeatureFlagValue(${name}) -> ${this.abby.getFeatureFlag(strippedFlagName)}`
    );

    return this.resolveData().pipe(
      map(() => this.abby.getFeatureFlag(strippedFlagName)),
      tap((value) => this.abbyLogger.log(`getFeatureFlagValue(${name}) =>`, value)),
      map((featureFlagValue) => {
        return (
          (!featureFlagValue && isFeatureFlagInverted) ||
          (featureFlagValue && !isFeatureFlagInverted)
        );
      }),
      shareReplay(1)
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

  public getAbbyInstance(): Abby<FlagName, TestName, Tests, Flags> {
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
    return this.resolveData().pipe(map((data) => this.abby.getVariants(name)));
  };

  public resetAB = <T extends keyof Tests>(name: T) => {
    TestStorageService.remove(this.config.projectId, name as string);
  };
}
