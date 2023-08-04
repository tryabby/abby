import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AbbyService } from "./abby.service";
import { AbbyModule } from "./abby.module";

import { Component, Injectable } from "@angular/core";
import { TestStorageService } from "./StorageService";
import type { AbbyConfig } from "@tryabby/core";
import { zip } from "rxjs";
import { Routes } from "@angular/router";
import { AbbyFlag } from "./flag.directive";

const mockConfig = {
  projectId: "mock-project-id",
  currentEnvironment: "test",
  environments: ["test", "production"],
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
  flags: {
    flag1: "Boolean",
    flag2: "Boolean",
    overridedFlag1: "Boolean",
    overridedFlag2: "Boolean",
    defaultFlag: "Boolean",
  },
  settings: {
    flags: {
      devOverrides: {
        overridedFlag1: true,
        overridedFlag2: false,
      },
      defaultValues: {
        Boolean: false,
      },
    },
  },
} satisfies AbbyConfig;

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
      value: true,
    },
    {
      name: "flag2",
      value: false,
    },
    {
      name: "overridedFlag1",
      value: false,
    },
    {
      name: "overridedFlag2",
      value: true,
    },
  ],
};
@Injectable({
  providedIn: "root",
  useExisting: AbbyService,
})
export class Abby extends AbbyService<
  keyof (typeof mockConfig)["flags"],
  keyof (typeof mockConfig)["tests"],
  (typeof mockConfig)["tests"],
  (typeof mockConfig)["flags"]
> {}

describe("AbbyService", () => {
  let service: Abby;
  let fixture: ComponentFixture<TestComponent>;

  @Component({
    template: `
      <div *abbyFlag="'flag1'">
        <h1>Flag 1</h1>
      </div>
      <div *abbyFlag="'flag2'">
        <h1>Flag 2</h1>
      </div>
      <div *abbyFlag="dynamicFlag">
        <h4>Dynamic Flag</h4>
      </div>
      <div *abbyTest="{ testName: 'test2', variant: 'A' }">
        <h2>A</h2>
      </div>
      <div *abbyTest="{ testName: 'test2', variant: 'B' }">
        <h3>B</h3>
      </div>
    `,
  })
  class TestComponent {
    dynamicFlag = 'flag1';
  }

  beforeAll(async () => {
    const fetchSpy = spyOn(window, "fetch");

    const mockedResponse = new Response(JSON.stringify(mockedData), {
      status: 200,
      headers: { "Content-type": "application/json" },
    });

    fetchSpy.and.returnValue(Promise.resolve(mockedResponse));

    await TestBed.configureTestingModule({
      declarations: [TestComponent],
      imports: [AbbyModule.forRoot(mockConfig)],
    })
      .compileComponents()
      .then(() => {
        fixture = TestBed.createComponent(TestComponent);
        fixture.detectChanges();
      });
    service = TestBed.inject(AbbyService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("gets the stored feature flag value using a function properly", () => {
    service.getFeatureFlagValue("flag1").subscribe((value) => {
      expect(value).toEqual(true);
    });

    service.getFeatureFlagValue("flag2").subscribe((value) => {
      expect(value).toEqual(false);
    });
  });

  it("returns the correct variant", () => {
    service.getVariant("test2").subscribe((value: string) => {
      expect(value).toEqual("A");
    });
  });

  it("uses lookup object when getting variant", () => {
    service.getVariant("test2", { A: 1, B: 2 }).subscribe((value) => {
      expect(value).toEqual(1);
    });
  });

  it("should respect the default values for feature flags", () => {
    service.getFeatureFlagValue("defaultFlag").subscribe((value) => {
      expect(value).toEqual(false);
    });
  });

  it("should respect the default values for variants", () => {
    service.getVariant("defaultTest").subscribe((value: string) => {
      expect(["A", "B"]).toContain(value);
    });
  });

  it("uses the devOverrides", () => {
    service.getFeatureFlagValue("overridedFlag1").subscribe((value) => {
      expect(value).toEqual(true);
    });

    service.getFeatureFlagValue("overridedFlag2").subscribe((value) => {
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

    zip(service.getVariant("test"), service.getFeatureFlagValue("flag1")).subscribe(
      ([angularTest, angularFlag]) => {
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

        expect(routes).not.toEqual([]);
      }
    );
  });

  it("returns the correct possible variant values", () => {
    service.getVariants("test").subscribe((value: readonly string[]) => {
      expect(value).toEqual(["A", "B", "C", "D"]);
    });
  });

  it("directives should work", () => {
    const compiled = fixture.nativeElement as HTMLElement;
    let flagElement = compiled.querySelector("h1");
    let testAElement = compiled.querySelector("h2");
    let testBElement = compiled.querySelector("h3");

    if (flagElement) {
      expect(flagElement.textContent).toEqual("Flag 1");
    } else fail("querySelector is null");
    if (testAElement) {
      expect(testAElement.textContent).toEqual("A");
    } else fail("querySelector is null");
  });

  it('evaluates flag directives with property bound values', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    let flagElement = compiled.querySelector("h4");
    expect(flagElement?.textContent).toEqual('Dynamic Flag');
  });
});
