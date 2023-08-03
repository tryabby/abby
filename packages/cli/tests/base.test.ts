import { AbbyConfig, PullAbbyConfigResponse } from "@tryabby/core";
import { HttpService } from "../src/http";
import { writeFile } from "fs/promises";

import { push } from "../src/push";
import { pullAndMerge } from "../src/pull";

vi.mock("../src/util", () => ({
  loadLocalConfig: () =>
    Promise.resolve({ config: sampleLocalConfig, configFilePath: "test-path" }),
}));

// we don't want to actually write to the file system
vi.mock("prettier", () => ({
  format: (str: string) => str,
}));

vi.mock("fs/promises", () => ({
  ...vi.importActual("fs/promises"),
  readFile: () =>
    Promise.resolve(`export default defineConfig(${JSON.stringify(sampleLocalConfig)});`),
  writeFile: vi.fn(),
}));

const API_KEY = "test";

const sampleLocalConfig = {
  environments: [],
  projectId: "test",
  tests: {
    test1: {
      variants: ["A", "B", "C", "D"],
    },
    test2: {
      variants: ["A", "B"],
    },
  },
  flags: { flag1: "Boolean", flag2: "Number" },
} satisfies AbbyConfig;

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
  flags: { flag1: "Boolean", flag2: "Number", flag3: "JSON" },
} satisfies PullAbbyConfigResponse;

describe("Abby CLI", () => {
  it("pushes the config properly", async () => {
    const spy = vi.spyOn(HttpService, "updateConfigOnServer");

    await push({ apiKey: API_KEY });

    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith({
      apiKey: API_KEY,
      localAbbyConfig: sampleLocalConfig,
    });
  });

  it("pulls the config properly", async () => {
    const spy = vi.spyOn(HttpService, "getConfigFromServer");
    spy.mockResolvedValueOnce(sampleServerConfig);
    await pullAndMerge({
      apiKey: API_KEY,
    });

    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith({
      projectId: sampleLocalConfig.projectId,
      apiKey: API_KEY,
    });
    expect(writeFile).toHaveBeenCalledOnce();
    // make sure the merged test (test 3) is included in the new file
    expect(writeFile).toHaveBeenCalledWith("test-path", expect.stringContaining("test3"));
  });
});
