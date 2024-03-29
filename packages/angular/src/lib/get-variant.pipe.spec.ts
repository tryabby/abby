import { TestBed } from "@angular/core/testing";
import { combineLatest } from "rxjs";
import { AbbyModule } from "./abby.module";
import { AbbyService } from "./abby.service";
import { GetAbbyVariantPipe } from "./get-variant.pipe";
import { AbbyConfig } from "@tryabby/core";

const mockConfig = {
  projectId: "mock-project-id",
  environments: [],
  currentEnvironment: "test",
  tests: {
    test: {
      variants: ["A", "B", "C", "D"],
    },
  },
  flags: [],
  settings: {},
} satisfies AbbyConfig;

const mockedData = {
  tests: [
    {
      name: "test",
      weights: [1, 1, 1, 1],
    },
  ],
  flags: [],
  remoteConfig: [],
};

describe("GetAbbyVariantPipe", () => {
  let pipe: GetAbbyVariantPipe<keyof (typeof mockConfig)["tests"], (typeof mockConfig)["tests"]>;
  let service: AbbyService<
    (typeof mockConfig)["flags"][number],
    keyof (typeof mockConfig)["tests"],
    (typeof mockConfig)["tests"]
  >;

  let fetchSpy: any;

  beforeAll(() => {
    fetchSpy = spyOn(window, "fetch");

    const mockedResponse = new Response(JSON.stringify(mockedData), {
      status: 200,
      headers: { "Content-type": "application/json" },
    });

    fetchSpy.and.returnValue(Promise.resolve(mockedResponse));

    TestBed.configureTestingModule({
      providers: [GetAbbyVariantPipe],
      imports: [AbbyModule.forRoot(mockConfig)],
    });

    service = TestBed.inject(AbbyService) as typeof service;
    pipe = TestBed.inject(GetAbbyVariantPipe);
  });

  it("creates pipe correctly", () => {
    expect(pipe).toBeTruthy();
  });

  it("returns currently active variant", () => {
    combineLatest([service.getVariant("test"), pipe.transform("test")]).subscribe(
      ([expected, actual]) => {
        expect(actual).toEqual(expected);
      }
    );
  });

  it("uses lookup object when supplied", () => {
    const lookupObject = {
      A: 1,
      B: 2,
      C: 3,
      D: 4,
    };

    combineLatest([service.getVariant("test", lookupObject), pipe.transform("test")]).subscribe(
      ([expected, actual]) => {
        expect(lookupObject[actual as keyof typeof lookupObject]).toEqual(expected as number);
      }
    );
  });
});
