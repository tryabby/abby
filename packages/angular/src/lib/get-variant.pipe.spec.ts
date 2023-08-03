import { fakeAsync, TestBed, tick } from "@angular/core/testing";
import { AbbyModule } from "./abby.module";
import { AbbyService } from "./abby.service";
import { GetAbbyVariantPipe } from "./get-variant.pipe";
import { TestStorageService } from "./StorageService";

const mockConfig = {
  projectId: "mock-project-id",
  currentEnvironment: "test",
  tests: {
    test: {
      variants: ["A"],
    }
  },
  flags: {},
  settings: {},
} as const;

const mockedData = {
  tests: [
    {
      name: "test",
      weights: [1],
    },
  ],
  flags: [],
};

describe("GetAbbyVariantPipe", () => {
  let pipe: GetAbbyVariantPipe<keyof (typeof mockConfig)["tests"], (typeof mockConfig)["tests"]>;
  let service: AbbyService<
    keyof (typeof mockConfig)["flags"],
    keyof (typeof mockConfig)["tests"],
    (typeof mockConfig)["tests"],
    (typeof mockConfig)["flags"]
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

    service = TestBed.inject(AbbyService);
    pipe = TestBed.inject(GetAbbyVariantPipe);
  });

  it('creates pipe correctly', () => {
    expect(pipe).toBeTruthy();
  });

  it('returns currently active variant', () => {
    pipe.transform("test").subscribe((value) => {
      expect(value).toEqual("A");
    });
  });

  it('uses lookup object when supplied', () => {
    pipe.transform("test", { A: 123 }).subscribe((value) => {
      expect(value).toEqual(123);
    });
  });
});
