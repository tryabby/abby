import { TestBed } from "@angular/core/testing";
import type { AbbyConfig } from "@tryabby/core";
import { AbbyModule } from "./abby.module";
import { GetRemoteConfigPipe } from "./get-remote-config.pipe";

const mockConfig = {
  projectId: "mock-project-id",
  environments: [],
  currentEnvironment: "test",
  tests: {},
  flags: [],
  remoteConfig: {
    remoteConfig1: "String",
  },
  settings: {},
} satisfies AbbyConfig;

const mockedData = {
  tests: [],
  flags: [],
  remoteConfig: [{ name: "remoteConfig1", value: "foobar" }],
};

describe("GetRemoteConfigurationPipe", () => {
  let pipe: GetRemoteConfigPipe<(typeof mockConfig)["remoteConfig"]>;

  let fetchSpy: any;

  beforeAll(() => {
    fetchSpy = spyOn(window, "fetch");

    const mockedResponse = new Response(JSON.stringify(mockedData), {
      status: 200,
      headers: { "Content-type": "application/json" },
    });

    fetchSpy.and.returnValue(Promise.resolve(mockedResponse));

    TestBed.configureTestingModule({
      providers: [GetRemoteConfigPipe],
      imports: [AbbyModule.forRoot(mockConfig)],
    });

    pipe = TestBed.inject(GetRemoteConfigPipe);
  });

  it("creates pipe correctly", () => {
    expect(pipe).toBeTruthy();
  });

  it("returns remote config value", () => {
    pipe.transform("remoteConfig1").subscribe((value) => {
      expect(value).toBe("foobar");
    });
  });
});
