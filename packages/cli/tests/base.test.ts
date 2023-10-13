import { PullAbbyConfigResponse, defineConfig } from "@tryabby/core";
import { HttpService } from "../src/http";
import { writeFile } from "fs/promises";

import { push } from "../src/push";
import { pullAndMerge } from "../src/pull";

// we don't want to actually write to the file system
vi.mock("prettier", () => ({
  format: (str: string) => str,
}));

vi.mock("fs/promises", async () => ({
  ...((await vi.importActual("fs/promises")) as object),
  writeFile: vi.fn(),
}));

const API_KEY = "test";

const sampleLocalConfig = [
  {
    projectId: "test",
  },
  {
    environments: [],
    tests: {
      test1: {
        variants: ["A", "B", "C", "D"],
      },
      test2: {
        variants: ["A", "B"],
      },
    },
    flags: ["flag1"],
    remoteConfig: { flag2: "Number" },
  },
] satisfies Parameters<typeof defineConfig>;

const sampleServerConfig = {
  environments: ["test"],
  tests: {
    test1: {
      variants: ["A", "B", "C", "D"],
    },
    test2: {
      variants: ["A", "B"],
    },
    test3: {
      variants: ["A", "B", "C", "D"],
    },
  },
  flags: ["flag1"],
  remoteConfig: { flag2: "Number", flag3: "JSON" },
} satisfies PullAbbyConfigResponse;

describe("Abby CLI", () => {
  beforeAll(() => {
    process.env["ABBY_PROJECT_ID"] = "test";
  });

  it("pushes the config properly", async () => {
    const spy = vi.spyOn(HttpService, "updateConfigOnServer");

    await push({ apiKey: API_KEY, configPath: __dirname + "/abby.config.stub.ts" });

    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith({
      apiKey: API_KEY,
      localAbbyConfig: { ...sampleLocalConfig[0], ...sampleLocalConfig[1] },
    });
  });

  it("pulls the config properly", async () => {
    const spy = vi.spyOn(HttpService, "getConfigFromServer");
    spy.mockResolvedValueOnce(sampleServerConfig);
    await pullAndMerge({
      apiKey: API_KEY,
      configPath: __dirname + "/abby.config.stub.ts",
    });

    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith({
      projectId: "test",
      apiKey: API_KEY,
    });
    expect(writeFile).toHaveBeenCalledOnce();
    // make sure the merged test (test 3) is included in the new file
    expect(writeFile).toHaveBeenCalledWith(
      __dirname + "/abby.config.stub.ts",
      expect.stringContaining("test3")
    );
  });

  it("doesn't overwrite dynamic configuration values", async () => {
    const spy = vi.spyOn(HttpService, "getConfigFromServer");
    spy.mockResolvedValueOnce(sampleServerConfig);
    await pullAndMerge({
      apiKey: API_KEY,
      configPath: __dirname + "/abby.config.stub.ts",
    });

    expect(writeFile).toHaveBeenCalledWith(
      __dirname + "/abby.config.stub.ts",
      expect.stringContaining(`process.env["ABBY_PROJECT_ID"]`)
    );
  });
});
