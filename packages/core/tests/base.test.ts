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
      environments: [],
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
      environments: [],
      projectId: "",
      tests: {
        a: { variants },
      },
    });

    abby.init({ flags: [], tests: [{ name: "a", weights: [0, 1] }], remoteConfig: [] });
    // const variant = abby.getTestVariant("a");
    expect(abby.getTestVariant("a")).toBe(variants[1]);
  });

  it("gets a feature flag", async () => {
    const abby = new Abby({
      environments: [],
      projectId: "abc",
      flags: ["flag1"],
    });

    await abby.loadProjectData();

    expect(abby.getFeatureFlag("flag1")).toBe(true);
  });

  it("gets a remote config", async () => {
    const abby = new Abby({
      environments: [],
      projectId: "foo",
      remoteConfig: { remoteConfig1: "String" },
    });

    await abby.loadProjectData();

    expect(abby.getRemoteConfig("remoteConfig1")).toBe("asdf");
  });

  it("uses the devOverrides", () => {
    const abby = new Abby({
      environments: [],
      projectId: "",
      flags: ["flag1"],
      remoteConfig: {
        remoteConfig1: "String",
      },
      settings: {
        flags: {
          devOverrides: {
            flag1: false,
          },
        },
        remoteConfig: {
          devOverrides: {
            remoteConfig1: "foobar",
          },
        },
      },
    });

    abby.init({
      flags: [{ name: "flag1", value: true }],
      tests: [],
      remoteConfig: [{ name: "remoteConfig1", value: "asdf" }],
    });

    process.env.NODE_ENV = "development";
    expect(abby.getFeatureFlag("flag1")).toBe(false);
    expect(abby.getRemoteConfig("remoteConfig1")).toBe("foobar");

    process.env.NODE_ENV = "production";
    expect(abby.getFeatureFlag("flag1")).toBe(true);
    expect(abby.getRemoteConfig("remoteConfig1")).toBe("asdf");
  });

  it("uses fallbacks", () => {
    const abby = new Abby({
      environments: [],
      projectId: "",
      remoteConfig: {
        config1: "String",
        config2: "String",
      },
      flags: ["flag1", "flag2"],
      settings: {
        flags: {
          fallbackValues: {
            flag1: false,
            flag2: true,
          },
        },
        remoteConfig: {
          fallbackValues: {
            config1: "fallback1",
          },
          defaultValues: {
            String: "default",
          },
        },
      },
    });

    abby.init({ flags: [], tests: [], remoteConfig: [] });

    expect(abby.getRemoteConfig("config1")).toBe("fallback1");

    expect(abby.getRemoteConfig("config2")).toBe("default");

    expect(abby.getFeatureFlag("flag1")).toBe(false);

    expect(abby.getFeatureFlag("flag2")).toBe(true);
  });

  it("uses env specific fallbacks", () => {
    let abby = new Abby({
      environments: ["development", "test"],
      projectId: "",
      currentEnvironment: "development",
      remoteConfig: {
        config1: "String",
        config2: "String",
      },
      flags: ["flag1", "flag2"],
      settings: {
        flags: {
          fallbackValues: {
            flag1: false,
            flag2: {
              test: true,
            },
          },
        },
        remoteConfig: {
          fallbackValues: {
            config1: "fallback1",
          },
          defaultValues: {
            String: "default",
          },
        },
      },
    });

    abby.init({ flags: [], tests: [], remoteConfig: [] });

    expect(abby.getRemoteConfig("config1")).toBe("fallback1");

    expect(abby.getRemoteConfig("config2")).toBe("default");

    expect(abby.getFeatureFlag("flag1")).toBe(false);

    expect(abby.getFeatureFlag("flag2")).toBe(false);

    abby = new Abby({
      environments: ["development", "test"],
      projectId: "",
      currentEnvironment: "test",
      remoteConfig: {
        config1: "String",
        config2: "String",
      },
      flags: ["flag1", "flag2"],
      settings: {
        flags: {
          fallbackValues: {
            flag1: false,
            flag2: {
              test: true,
            },
          },
        },
        remoteConfig: {
          fallbackValues: {
            config1: "fallback1",
          },
          defaultValues: {
            String: "default",
          },
        },
      },
    });
    abby.init({ flags: [], tests: [], remoteConfig: [] });

    expect(abby.getFeatureFlag("flag2")).toBe(true);
  });

  it("updates a local variant in dev mode", () => {
    process.env.NODE_ENV = "development";

    const abby = new Abby({
      environments: [],
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
      environments: [],
      projectId: "",
      flags: ["flag1"],
    });

    abby.init({ flags: [{ name: "flag1", value: true }], tests: [], remoteConfig: [] });

    expect(abby.getFeatureFlag("flag1")).toBe(true);

    abby.updateFlag("flag1", false);

    expect(abby.getFeatureFlag("flag1")).toBe(false);
  });

  it("updates local remote config", () => {
    const abby = new Abby({
      environments: [],
      projectId: "",
      remoteConfig: { remoteConfig1: "String" },
    });

    abby.init({ flags: [], tests: [], remoteConfig: [{ name: "remoteConfig1", value: "foo" }] });

    expect(abby.getRemoteConfig("remoteConfig1")).toBe("foo");

    abby.updateRemoteConfig("remoteConfig1", "bar");

    expect(abby.getRemoteConfig("remoteConfig1")).toBe("bar");
  });
});

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
