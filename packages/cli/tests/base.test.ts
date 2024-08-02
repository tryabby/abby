import { PullAbbyConfigResponse, defineConfig } from "@tryabby/core";
import { HttpService } from "../src/http";
import { writeFile as mgWriteFile } from "magicast";
import { writeFile } from "fs/promises";
import prompts from "prompts";

import { push } from "../src/push";
import { pullAndMerge } from "../src/pull";
import { addFlag } from "../src/add-flag";
import { addRemoteConfig } from "../src/add-remote-config";

// we don't want to actually write to the file system
vi.mock("prettier", () => ({
  format: (str: string) => str,
}));

vi.mock("fs/promises", async () => ({
  ...(await vi.importActual<typeof import("fs/promises")>("fs/promises")),
  writeFile: vi.fn(),
}));

vi.mock("magicast", async () => ({
  ...(await vi.importActual<typeof import("magicast")>("magicast")),
  writeFile: vi.fn(),
}));

const API_KEY = "test";

const sampleLocalConfig = [
  {
    projectId: "test",
    currentEnvironment: "development",
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

  beforeEach(() => {
    vi.resetAllMocks();
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

  it("adds a flag and pushes it", async () => {
    prompts.inject(["newFlag"]);
    const httpSpy = vi.spyOn(HttpService, "updateConfigOnServer");

    await addFlag({ apiKey: API_KEY, configPath: __dirname + "/abby.config.stub.ts" });

    expect(mgWriteFile).toHaveBeenCalledWith(expect.anything(), __dirname + "/abby.config.stub.ts");
    expect(httpSpy).toHaveBeenCalledOnce();
  });

  it("adds a remote config and pushes it", async () => {
    prompts.inject(["newRemoteConfig", "String"]);
    const spy = vi.spyOn(HttpService, "updateConfigOnServer");

    await addRemoteConfig({ apiKey: API_KEY, configPath: __dirname + "/abby.config.stub.ts" });

    expect(mgWriteFile).toHaveBeenCalledWith(expect.anything(), __dirname + "/abby.config.stub.ts");
    expect(spy).toHaveBeenCalledOnce();
  });

  it("restores old config when push after adding flag fails", async () => {
    prompts.inject(["newFlag"]);
    const spy = vi.spyOn(HttpService, "updateConfigOnServer");
    spy.mockImplementation(() => {
      throw new Error("failed");
    });

    let errorCaught = false;
    try {
      await addFlag({ apiKey: API_KEY, configPath: __dirname + "/abby.config.stub.ts" });
    } catch (error) {
      expect(error).instanceof(Error);
      expect((error as Error).message).toBe("failed");
      errorCaught = true;
    }

    expect(errorCaught).toBe(true);

    expect(mgWriteFile).toHaveBeenCalledTimes(2);
    expect(mgWriteFile).toHaveBeenLastCalledWith(
      expect.anything(),
      __dirname + "/abby.config.stub.ts"
    );
  });

  it("restores old config when push after adding remote config fails", async () => {
    prompts.inject(["newRemoteConfig", "String"]);
    const spy = vi.spyOn(HttpService, "updateConfigOnServer");
    spy.mockImplementation(() => {
      throw new Error("failed");
    });

    let errorCaught = false;
    try {
      await addRemoteConfig({ apiKey: API_KEY, configPath: __dirname + "/abby.config.stub.ts" });
    } catch (error) {
      expect(error).instanceof(Error);
      expect((error as Error).message).toBe("failed");
      errorCaught = true;
    }

    expect(errorCaught).toBe(true);

    expect(mgWriteFile).toHaveBeenCalledTimes(2);
    expect(mgWriteFile).toHaveBeenLastCalledWith(
      expect.anything(),
      __dirname + "/abby.config.stub.ts"
    );
  });
});
