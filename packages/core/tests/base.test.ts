import { Abby } from "../src/index";
import { validateWeights } from "../src/mathHelpers";

const OLD_ENV = process.env;

beforeEach(() => {
  vi.resetModules(); // Most important - it clears the cache
  process.env = { ...OLD_ENV }; // Make a copy
});

afterAll(() => {
  process.env = OLD_ENV; // Restore old environment
});

describe("Abby", () => {
  it("gets a variant", () => {
    const variants = ["variant1", "variant2"];

    const abby = new Abby({
      projectId: "",
      tests: {
        a: { variants },
        b: {
          variants: ["test"],
        },
      },
    });
    const variant = abby.getTestVariant("a");
    expect(variant.includes(variant)).toBe(true);
  });

  it("gets correct weigthed variant", () => {
    const variants = ["variant1", "variant2"];

    const abby = new Abby({
      projectId: "",
      tests: {
        a: { variants },
      },
    });

    abby.init({ flags: [], tests: [{ name: "a", weights: [0, 1] }] });
    // const variant = abby.getTestVariant("a");
    expect(abby.getTestVariant("a")).toBe(variants[1]);
  });

  it("gets a feature flag", async () => {
    const abby = new Abby({
      projectId: "abc",
      flags: {
        flag1: "String",
        flag2: "Boolean",
      },
    });

    await abby.loadProjectData();

    expect(abby.getFeatureFlag("flag1")).toBe(true);

    expect(abby.getFeatureFlag("flag2")).toEqual("test");
  });

  it("uses the devOverrides", () => {
    const abby = new Abby({
      projectId: "",
      flags: {
        flag1: "Boolean",
      },
      settings: {
        flags: {
          devOverrides: {
            flag1: false,
          },
        },
      },
    });

    abby.init({ flags: [{ name: "flag1", value: true }], tests: [] });

    process.env.NODE_ENV = "development";
    expect(abby.getFeatureFlag("flag1")).toBe(false);

    process.env.NODE_ENV = "production";
    expect(abby.getFeatureFlag("flag1")).toBe(true);
  });

  it("updates a local variant in dev mode", () => {
    process.env.NODE_ENV = "development";

    const abby = new Abby({
      projectId: "",
      tests: {
        a: { variants: ["variant1", "variant2"] },
        b: {
          variants: ["test"],
        },
      },
    });

    abby.updateLocalVariant("a", "variant2");
    expect(abby.getTestVariant("a")).toBe("variant2");

    abby.updateLocalVariant("a", "variant1");
    expect(abby.getTestVariant("a")).toBe("variant1");
  });

  it("updates local feature flag", () => {
    const abby = new Abby({
      projectId: "",
      flags: {
        flag1: "Boolean",
        flag2: "String",
      },
    });

    abby.init({ flags: [{ name: "flag1", value: true }], tests: [] });

    expect(abby.getFeatureFlag("flag1")).toBe(true);

    abby.updateFlag("flag1", false);

    expect(abby.getFeatureFlag("flag1")).toBe(false);
  });

  it("refetches an expired flag", async () =>{
    const date = new Date() //current date
    vi.setSystemTime(date)
    const abby = new Abby({
      projectId: "expired",
      flags: ["flag1", "flag2"],
      flagCacheConfig: {
        refetchFlags: true,
        timeToLive: 2
      }
    });
    await abby.loadProjectData()
    const expiredDate = new Date(new Date().getTime() + 1000 * 60  * 10) //date in 100 minutes
    vi.setSystemTime(expiredDate)
    const spy = vi.spyOn(abby, "refetchFlags")

   expect(abby.getFeatureFlag("flag1")).toBeTruthy();
    expect(abby.getFeatureFlag("flag2")).toBeFalsy();
    expect(spy).toBeCalled()
  })

  it("non expired flag does not get refetched", async () => {
    const date = new Date() //current date
    vi.setSystemTime(date)
    const abby = new Abby({
      projectId: "expired",
      flags: ["flag1", "flag2"],
      flagCacheConfig: {
        refetchFlags: true,
        timeToLive: 2
      }
    });

    await abby.loadProjectData();

    const spy = vi.spyOn(abby, "refetchFlags")

    expect(abby.getFeatureFlag("flag1")).toBeTruthy();
    expect(abby.getFeatureFlag("flag2")).toBeFalsy();
    expect(spy).not.toBeCalled()
  })

  it("respects the featureFlagCacheConfig refetchFlags value set to false", async () => {
    const date = new Date() //current date
    vi.setSystemTime(date)
    const abby = new Abby({
      projectId: "expired",
      flags: ["flag1", "flag2"],
      flagCacheConfig: {
        refetchFlags: false,
        timeToLive: 2
      }
    });

    await abby.loadProjectData();

    const spy = vi.spyOn(abby, "refetchFlags")

    expect(abby.getFeatureFlag("flag1")).toBeTruthy();
    expect(abby.getFeatureFlag("flag2")).toBeFalsy();
    expect(spy).not.toBeCalled()    
  })

  it("", async () => {
    const date = new Date() //current date
    vi.setSystemTime(date)
    const abby = new Abby({
      projectId: "expired",
      flags: ["flag1", "flag2"],
      flagCacheConfig: {
        refetchFlags: true,
        timeToLive: 2
      }
    });

    await abby.loadProjectData();

    const spy = vi.spyOn(abby, "refetchFlags")

    //set date to 5 Minutes in the future
    const dateIn3Minutes = new Date(new Date().getTime() + 1000 * 60 * 5);
    vi.setSystemTime(dateIn3Minutes)

    expect(abby.getFeatureFlag("flag1")).toBeTruthy();
    expect(abby.getFeatureFlag("flag2")).toBeFalsy();
    expect(spy).toBeCalled()
  })

  it("respects the featureFlagCacheCOnfig expiration time", async () => {
    const date = new Date() //current date
    vi.setSystemTime(date)
    const abby = new Abby({
      projectId: "expired",
      flags: ["flag1", "flag2"],
      flagCacheConfig: {
        refetchFlags: true,
        timeToLive: 2
      }
    });

    await abby.loadProjectData();
    
    const spy = vi.spyOn(abby, "refetchFlags")
    
    expect(abby.getFeatureFlag("flag1")).toBeTruthy();
    expect(abby.getFeatureFlag("flag2")).toBeFalsy();
    expect(spy).not.toBeCalled()

    //set date to 5 Minutes in the future
    const dateIn3Minutes = new Date(new Date().getTime() + 1000 * 60 * 5);
    vi.setSystemTime(dateIn3Minutes)
    expect(abby.getFeatureFlag("flag1")).toBeTruthy();
    expect(abby.getFeatureFlag("flag2")).toBeFalsy();
    expect(spy).toBeCalled()
  })

});

it("respects the default behaviour", async () => {
  const date = new Date() //current date
  vi.setSystemTime(date)
  const abby = new Abby({
    projectId: "expired",
    flags: ["flag1", "flag2"],
  });

  await abby.loadProjectData();
  
  const spy = vi.spyOn(abby, "refetchFlags")
  
    //set date to 5 Minutes in the future
    const dateIn3Minutes = new Date(new Date().getTime() + 1000 * 60 * 5);
    vi.setSystemTime(dateIn3Minutes)

  expect(abby.getFeatureFlag("flag1")).toBeTruthy();
  expect(abby.getFeatureFlag("flag2")).toBeFalsy();
  expect(spy).not.toBeCalled()
})

describe("Math helpers", () => {
  it("validates weight", () => {
    const variants = ["variant1", "variant2"];
    const weight = [0.25, 0.75];

    const validatedWeights1 = validateWeights(variants, weight);
    expect(validatedWeights1).toEqual([0.25, 0.75]);

    const validatedWeights2 = validateWeights(variants);
    expect(validatedWeights2).toEqual([0.5, 0.5]);
  });
});
