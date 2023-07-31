import { AbbyConfig } from "@tryabby/core";
import { HttpService } from "../src/http";
import { push } from "../src/push";
import { getConfigFromFileString, getParsedJSONString, getRegex, loadLocalConfig, updateConfigFile } from "../src/util";
import { config } from "process";
import { pull, updateConfig } from "../src/pull";
import { get } from "https";
import { check } from "../src/check";

const OLD_ENV = process.env;

beforeEach(() => {
  vi.resetModules(); // Most important - it clears the cache
  process.env = { ...OLD_ENV }; // Make a copy
});

afterAll(() => {
  process.env = OLD_ENV; // Restore old environment
});

const sampleLocalConfig = {
    projectId: "test",
    tests: {
      test1: {
        variants: ["A", "B", "C", "D"],
      },
      test2: {
        variants: ["A", "B"],
      },
    },
    flags: ["flag1", "flag2"]
};

const sampleServerConfig = {
  projectId: "test",
  tests: {
    test1: {
      variants: ["A", "B", "C", "D"],
    },
    test2: {
      variants: ["A", "B"],
    },
    test3: {
      variants: ["A", "B", "C", "D"],
    }
  },
  flags: ["flag1", "flag2", "flag3"]
}


const filePathAngular = "./tests/mocks/angularSample.ts";
const filePathReact = "./tests/mocks/reactSample.ts";

describe("Abby CLI", () => {

    it("sends put request", async () => {
        const spy = vi.spyOn(HttpService, "updateConfigOnServer");
        await push("./tests/mocks/angularSample.ts", "09876543210987654321");

        expect(spy).toHaveBeenCalledWith(
            "test", "09876543210987654321", sampleLocalConfig as AbbyConfig, undefined
        );
        
    });

    it("gets angular config from file", async () => {
        const expectedConfig = sampleLocalConfig as AbbyConfig;

        const fileString = await loadLocalConfig(filePathAngular);
        const config = getConfigFromFileString(fileString);

        expect(config).toEqual(expectedConfig);
    });

    it("gets react config from server", async () => {
        const expectedConfig = sampleLocalConfig as AbbyConfig;

        const fileString = await loadLocalConfig(filePathReact);
        const config = getConfigFromFileString(fileString);

        expect(config).toEqual(expectedConfig);
    });

    it("pulls data", async () => {
      const spy = vi.spyOn(HttpService, "getConfigFromServer");
        const fileString = await loadLocalConfig(filePathAngular);
        const configFromFile: AbbyConfig = getConfigFromFileString(fileString);

        const configFromAbby = await HttpService.getConfigFromServer(configFromFile.projectId, "09876543210987654321") as any;

        if (configFromAbby) {
            const updatedConfigString = await updateConfig(configFromFile, configFromAbby);

            expect(updatedConfigString).toEqual(getParsedJSONString(sampleServerConfig));
        } else throw new Error("Config in file not found");
    });

    it("checks flags and tests", async () => {
      const spy = vi.spyOn(HttpService, "getConfigFromServer");
      const upToDateFalse = await check(filePathAngular, "09876543210987654321");

      expect(upToDateFalse).toEqual(false);

      const upToDateTrue = await check(filePathAngular, "test");
      expect(upToDateTrue).toEqual(true);
    });

    it("pull test", async () => {
      await pull(filePathReact, "09876543210987654321");
    });

});