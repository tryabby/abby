import { TestBed } from "@angular/core/testing";

import { AbbyService } from "./abby.service";
import { AbbyModule } from "./abby.module";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";

import { Component, Injectable } from "@angular/core";
import { TestStorageService } from "./StorageService";
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


  })

  beforeEach(() => {

  });

  it("should be created", () => {
    const fetchSpy = spyOn(window, "fetch");

    const mockedResponse = new Response(JSON.stringify(mockedData), {
      status: 200,
      headers: { "Content-type": "application/json" },
    });

    fetchSpy.and.returnValue(Promise.resolve(mockedResponse));

    expect(service).toBeTruthy();
  });

  it("gets the stored feature flag value using a function properly", () => {

    const mockedResponse = new Response(JSON.stringify(mockedData), {
      status: 200,
      headers: { "Content-type": "application/json" },
    });

    const getFetchSpy = spyOn(window, 'fetch').and.callFake(() =>
      Promise.resolve(mockedResponse)
    );

    service.getFeatureFlagValue("flag1").subscribe((value: boolean) => {
      expect(value).toEqual(true);
    });

    service.getFeatureFlagValue("flag2").subscribe((value: boolean) => {
      expect(value).toEqual(false);
    });
  });

  it("returns the correct variant", () => {
    const fetchSpy = spyOn(window, "fetch");

    const mockedResponse = new Response(JSON.stringify(mockedData), {
      status: 200,
      headers: { "Content-type": "application/json" },
    });

    fetchSpy.and.returnValue(Promise.resolve(mockedResponse));

    service.getVariant("test2").subscribe((value: string) => {
      expect(value).toEqual("A");
    });
  });

  // it("should repect the default values for feature flags", () => {
  //   service.getFeatureFlagValue("defaultFlag").subscribe((value: boolean) => {
  //     expect(value).toEqual(false);
  //   });
  // });

  it("uses the devOverrides", () => {

    const fetchSpy = spyOn(window, "fetch");

    const mockedResponse = new Response(JSON.stringify(mockedData), {
      status: 200,
      headers: { "Content-type": "application/json" },
    });

    fetchSpy.and.returnValue(Promise.resolve(mockedResponse));

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

    const fetchSpy = spyOn(window, "fetch");
    const getSpy = spyOn(TestStorageService, "get");
    const setSpy = spyOn(TestStorageService, "set");
    const mockedResponse = new Response(JSON.stringify(mockedData), {
      status: 200,
      headers: { "Content-type": "application/json" },
    });

    fetchSpy.and.returnValue(Promise.resolve(mockedResponse));

    getSpy.and.returnValue(persistedValue);

    service.getVariant("test").subscribe((value: string) => {
      expect(setSpy).not.toHaveBeenCalled();
      expect(getSpy).toHaveBeenCalled();
      expect(value).toEqual(persistedValue);
    }); 
  });

  // it("should notify the server with OnAct", () => {
  //   const mockedResponse = new Response(JSON.stringify(mockedData), {
  //     status: 200,
  //     headers: { "Content-type": "application/json" },
  //   });

  //   const getFetchSpy = spyOn(window, 'fetch').and.callFake(() =>
  //     Promise.resolve(mockedResponse)
  //   );

  //   console.log(getFetchSpy); 

  //   const onActSpy = spyOn(service, "onAct").and.identity


  //   // fetchSpy.and.returnValue(Promise.resolve(mockedResponse)).and.callThrough;

  //   service.onAct("test");

  //   // expect(fetchSpy).toHaveBeenCalled();

  //   // const type = fetchSpy.calls.argsFor(0)[0].valueOf();
  //   // fetchSpy.calls.argsFor(0)[0].type;

  //   //expect(spy).toHaveBeenCalledWith();

  //   //expect(type).toBe(AbbyEventType.ACT);
  // });

  // it("should get the correct router variant", () => {
  //   let routes: Routes = [];

  //   forkJoin({
  //     angularTest: service.getVariant("test"),
  //     angularFlag: service.getFeatureFlagValue("flag1"),
  //   }).subscribe(({ angularTest, angularFlag }) => {
  //     routes = [
  //       service.getRouterVariant(angularTest, {
  //         path: "test",
  //         outlet: "test",
  //         abbyVariants: {
  //           A: {
  //             title: "TEST A",
  //             component: "ATestComponent" as any,
  //           },
  //           B: {
  //             title: "TEST B",
  //             component: "BTestComponent" as any,
  //           },
  //           C: {
  //             title: "TEST C",
  //             component: "CTestComponent" as any,
  //           },
  //           D: {
  //             title: "TEST D",
  //             component: "DTestComponent" as any,
  //           },
  //         },
  //       }),
  //       {
  //         ...(angularFlag
  //           ? {
  //               path: "flag",
  //               title: "Flag",
  //               component: "FlagComponent" as any,
  //               outlet: "flag",
  //             }
  //           : undefined),
  //       },
  //     ];
  //     console.log(routes);
  //   });
  // });
});
