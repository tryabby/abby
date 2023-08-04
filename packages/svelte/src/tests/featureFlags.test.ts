import { createAbby } from "../lib/createAbby";
import { get } from "svelte/store";
import { it, describe, expect } from "vitest";

const OLD_ENV = process.env;

describe("featureFlags working", () => {
  it("should return the correct feature flags", async () => {
    const FLAG1 = "flag1";
    const FLAG2 = "flag2";

    const { useFeatureFlag, __abby__ } = createAbby({
      environments: [],
      projectId: "123",
      flags: {
        [FLAG1]: "Boolean",
        [FLAG2]: "String",
      },
    });

    // await server fetch
    await __abby__.loadProjectData();

    const recievedFlag1 = get(useFeatureFlag(FLAG1));
    const recievedFlag2 = get(useFeatureFlag(FLAG2));
    expect(recievedFlag1).toEqual(true);
    expect(recievedFlag2).toEqual("someValue");
  });

  it("should respect the default values for feature flags", async () => {
    const { useFeatureFlag, __abby__ } = createAbby({
      environments: [],
      projectId: "123",
      flags: {
        flag1: "Boolean",
        flag2: "String",
      },
      currentEnvironment: "a",
      settings: {
        flags: {
          defaultValues: {
            Boolean: false,
            String: "default",
          },
        },
      },
    });
    const flag2 = get(useFeatureFlag("flag2"));
    expect(flag2).toEqual("default");
    // wait for the flag to be fetched
    await __abby__.loadProjectData();
    expect(get(useFeatureFlag("flag2"))).toEqual("someValue");
  });

  it("uses the devOverrides", () => {
    process.env.NODE_ENV = "development";
    const { useFeatureFlag } = createAbby({
      environments: [],
      projectId: "123",
      flags: {
        flag1: "Boolean",
        flag2: "String",
      },
      currentEnvironment: "a",
      settings: {
        flags: {
          devOverrides: {
            flag1: false,
            flag2: "devDefault",
          },
        },
      },
    });
    const flag1 = get(useFeatureFlag("flag1"));

    expect(flag1).toEqual(false);

    // will stay false and won't be overwritten by a fetch
    expect(get(useFeatureFlag("flag1"))).toEqual(false);

    const flag2 = get(useFeatureFlag("flag2"));

    expect(flag2).toEqual("devDefault");

    // will stay true and won't be overwritten by a fetch
    expect(get(useFeatureFlag("flag2"))).toEqual("devDefault");
  });

  it("gets the value for an enviroment", async () => {
    const { getFeatureFlagValue, __abby__ } = createAbby({
      environments: [],
      projectId: "123",
      flags: {
        flag1: "Boolean",
        flag2: "String",
      },
      currentEnvironment: "a",
    });

    // await server fetch
    await __abby__.loadProjectData();

    expect(getFeatureFlagValue("flag1")).toEqual(true);
    expect(getFeatureFlagValue("flag2")).toEqual("someValue");
  });
});
