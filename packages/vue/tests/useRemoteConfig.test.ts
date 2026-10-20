import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createAbby } from "../src";

const OLD_ENV = process.env;

beforeEach(() => {
  document.cookie = "";
  vi.resetModules();
  process.env = { ...OLD_ENV };
});

afterAll(() => {
  process.env = OLD_ENV;
});

describe("useRemoteConfig", () => {
  it("returns default value and updates on loadProjectData", async () => {
    const { useRemoteConfig, __abby__ } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      remoteConfig: {
        remoteConfig1: "String",
      },
    });

    const rc = useRemoteConfig("remoteConfig1");
    expect(rc.value).toBe("");

    await __abby__.loadProjectData();
    expect(rc.value).toBe("FooBar");
  });

  it("supports getRemoteConfig synchronous lookup", async () => {
    const { getRemoteConfig, __abby__ } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      remoteConfig: {
        remoteConfig1: "String",
      },
    });

    await __abby__.loadProjectData();
    expect(getRemoteConfig("remoteConfig1")).toBe("FooBar");
  });

  it("allows querying all remote config variables via useRemoteConfigVariables", async () => {
    const { useRemoteConfigVariables, __abby__ } = createAbby({
      environments: [""],
      currentEnvironment: "",
      projectId: "123",
      remoteConfig: {
        remoteConfig1: "String",
      },
    });

    const vars = useRemoteConfigVariables();
    expect(vars.value).toEqual([{ name: "remoteConfig1", value: "" }]);

    await __abby__.loadProjectData();
    expect(vars.value).toEqual([{ name: "remoteConfig1", value: "FooBar" }]);
  });
});
