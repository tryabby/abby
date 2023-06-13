import { TestBed } from "@angular/core/testing";

import { AbbyService } from "./abby.service";
import { AbbyModule } from "./abby.module";

import { Component, Injectable } from "@angular/core";
import { TestStorageService } from "./StorageService";
import { zip } from "rxjs";
import { Routes } from "@angular/router";
import { AbbyFlag } from "./flag.directive";
// import { TestStorageService } from "./StorageService";
// import { HttpService } from "shared/src/http";
// import { AbbyEventType } from "@tryabby/core";
// import { Routes } from "@angular/router";
// import { forkJoin } from "rxjs";

const mockConfig = {
  projectId: "mock-project-id",
  currentEnvironment: "test",
  tests: {
    test: {
      variants: ["A", "B", "C", "D"],
    },
    test2: {
      variants: ["A", "B"],
    },
    defaultTest: {
      variants: ["A", "B"],
    },
  },
  flags: ["flag1", "flag2", "overridedFlag1", "overridedFlag2", "defaultFlag"],
  settings: {
    flags: {
      devOverrides: {
        overridedFlag1: true,
        overridedFlag2: false,
      },
    },
  },
};

const mockedData = {
  tests: [
    {
      name: "test",
      weights: [1, 1, 1, 1],
    },
    {
      name: "test2",
      weights: [1, 0],
    },
  ],
  flags: [
    {
      name: "flag1",
      isEnabled: true,
    },
    {
      name: "flag2",
      isEnabled: false,
    },
    {
      name: "overridedFlag1",
      isEnabled: false,
    },
    {
      name: "overridedFlag2",
      isEnabled: true,
    },
  ],
};
@Injectable({
  providedIn: "root",
  useExisting: AbbyService,
})
export class Abby extends AbbyService<
  (typeof mockConfig)["flags"][number],
  keyof (typeof mockConfig)["tests"]
> {}

describe("AbbyService", () => {
  let service: AbbyService;

  beforeAll(() => {
    TestBed.configureTestingModule({
      imports: [AbbyModule.forRoot(mockConfig)],
    });
    service = TestBed.inject(AbbyService);

    const fetchSpy = spyOn(window, "fetch");

    const mockedResponse = new Response(JSON.stringify(mockedData), {
      status: 200,
      headers: { "Content-type": "application/json" },
    });

    fetchSpy.and.returnValue(Promise.resolve(mockedResponse));
  });

  beforeEach(() => {});

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("gets the stored feature flag value using a function properly", () => {
    service.getFeatureFlagValue("flag1").subscribe((value: boolean) => {
      expect(value).toEqual(true);
    });

    service.getFeatureFlagValue("flag2").subscribe((value: boolean) => {
      expect(value).toEqual(false);
    });
  });

  it("returns the correct variant", () => {
    service.getVariant("test2").subscribe((value: string) => {
      expect(value).toEqual("A");
    });
  });

  it("should repect the default values for feature flags", () => {
    service.getFeatureFlagValue("defaultFlag").subscribe((value: boolean) => {
      expect(value).toEqual(false);
    });
  });

  it("should repect the default values for variants", () => {
    service.getVariant("defaultTest").subscribe((value: string) => {
      expect(["A", "B"]).toContain(value);
    });
  });

  it("uses the devOverrides", () => {
    service
      .getFeatureFlagValue("overridedFlag1")
      .subscribe((value: boolean) => {
        expect(value).toEqual(true);
      });

    service
      .getFeatureFlagValue("overridedFlag2")
      .subscribe((value: boolean) => {
        expect(value).toEqual(false);
      });
  });

  it("should use the persistedValue", () => {
    const persistedValue = "A";
    const variants = ["A", "B", "C", "D"];

    const getSpy = spyOn(TestStorageService, "get");
    const setSpy = spyOn(TestStorageService, "set");

    getSpy.and.returnValue(persistedValue);

    service.getVariant("test").subscribe((value: string) => {
      expect(setSpy).not.toHaveBeenCalled();
      expect(getSpy).toHaveBeenCalled();
      expect(value).toEqual(persistedValue);
    });
  });

  it("should get the correct router variant", () => {
    @Component({})
    class ATestComponent {}

    @Component({})
    class BTestComponent {}

    @Component({})
    class CTestComponent {}

    @Component({})
    class DTestComponent {}

    @Component({})
    class FlagComponent {}

    let routes: Routes = [];

    zip(
      service.getVariant("test"),
      service.getFeatureFlagValue("flag1")
    ).subscribe(([angularTest, angularFlag]) => {
      routes = [
        service.getRouterVariant(angularTest, {
          path: "test",
          outlet: "test",
          abbyVariants: {
            A: {
              title: "TEST A",
              component: ATestComponent,
            },
            B: {
              title: "TEST B",
              component: BTestComponent,
            },
            C: {
              title: "TEST C",
              component: CTestComponent,
            },
            D: {
              title: "TEST D",
              component: DTestComponent,
            },
          },
        }),
        ...(angularFlag
          ? [
              {
                path: "flag",
                title: "Flag",
                component: FlagComponent,
              },
            ]
          : []),
      ];
      console.log(routes);

      expect(routes).not.toEqual([]);
    });
  });

  // it("directives should work", () => {
  //   @Component({
  //     template: `
  //       <div *featureFlag="'flag1'">
  //         <h1>Flag 1</h1>
  //       </div>
  //       <div *featureFlag="'flag2'">
  //         <h1>Flag 2</h1>
  //       </div>
  //     `,
  //   })
  //   class TestComponent {}

  //   const fixture = TestBed.createComponent(TestComponent);
  //   fixture.detectChanges();

  //   const compiled = fixture.nativeElement as HTMLElement;

  //   expect(compiled.querySelector("h1")?.textContent).toEqual("Flag 1");
  // });
});
