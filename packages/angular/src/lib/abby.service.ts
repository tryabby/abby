import { Inject, Injectable } from "@angular/core";
import {
  AbbyConfig,
  ABConfig,
  Abby,
  AbbyEventType,
  HttpService,
  FlagValueString,
  FlagValue,
} from "@tryabby/core";
import { FlagStorageService, TestStorageService } from "./StorageService";
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
  take,
  tap,
} from "rxjs";
import { F } from "ts-toolbelt";
import { Route } from "@angular/router";
import { ABBY_CONFIG_TOKEN } from "./abby.module";

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

@Injectable({ providedIn: "root" })
export class AbbyService<
  FlagName extends string = string,
  TestName extends string = string,
  Tests extends Record<TestName, ABConfig> = Record<TestName, ABConfig>,
  Flags extends Record<FlagName, FlagValueString> = Record<FlagName, FlagValueString>
> {
  private abby: Abby<FlagName, TestName, Tests, Flags>;

  private selectedVariants: { [key: string]: string } = {};

  private config: F.Narrow<AbbyConfig<FlagName, Tests, Flags>>;

  private projectData$?: Observable<LocalData<FlagName, TestName>>;

  private log = (...args: any[]) =>
    this.config.debug ? console.log(`ng.AbbyService`, ...args) : () => {};
  private cookieChanged$ = new Subject<void>();

  constructor(@Inject(AbbyService) config: F.Narrow<AbbyConfig<FlagName, Tests, Flags>>) {
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
    return this.resolveData().pipe(
      map(() => void 0)
    );
  }

  public getVariant<T extends keyof Tests>(testName: T): Observable<string> {
    this.log(`getVariant(${testName as string})`);

    return this.resolveData().pipe(
      map((data) => this.abby.getTestVariant(testName)),
      tap((variant) => (this.selectedVariants[testName as string] = variant)),
      tap((variant) => this.log(`getVariant(${testName as string}) =>`, variant))
    );
  }

  public onAct(testName: string): void {
    this.log(`onAct(${testName})`);

    if (!this.selectedVariants[testName]) return;

    this.log({
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

  public getFeatureFlagValue<F extends FlagName>(name: F) {
    console.log("getFeatureFlagValue", name, this.abby.getFeatureFlag(name));
    this.log(`getFeatureFlagValue(${name})`);

    return this.resolveData().pipe(
      map((data) => this.abby.getFeatureFlag(name)),
      tap((value) => this.log(`getFeatureFlagValue(${name}) =>`, value))
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
