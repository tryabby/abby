import { Abby } from "../src/index";
import { validateWeights } from "../src/mathHelpers";
import * as validation from "../src/validation";

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
      environments: [""],
      currentEnvironment: "",
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
      environments: [""],
      currentEnvironment: "",
      projectId: "",
      tests: {
        a: { variants },
      },
    });

    abby.init({
      flags: [],
      tests: [{ name: "a", weights: [0, 1] }],
      remoteConfig: [],
    });
    // const variant = abby.getTestVariant("a");
    expect(abby.getTestVariant("a")).toBe(variants[1]);
  });

  it("gets a feature flag", async () => {
    const abby = new Abby({
      environments: [""],
      currentEnvironment: "",
      projectId: "abc",
      flags: ["flag1"],
    });

    await abby.loadProjectData();

    expect(abby.getFeatureFlag("flag1")).toBe(true);
  });

  it("gets a remote config", async () => {
    const abby = new Abby({
      environments: [""],
      currentEnvironment: "",
      projectId: "foo",
      remoteConfig: { remoteConfig1: "String" },
    });

    await abby.loadProjectData();

    expect(abby.getRemoteConfig("remoteConfig1")).toBe("asdf");
  });

  it("uses the devOverrides", () => {
    const abby = new Abby({
      environments: [""],
      currentEnvironment: "",
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
      environments: [""],
      currentEnvironment: "",
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

    expect(abby.getFeatureFlag("flag2")).toBe(true);
  });

  it("updates a local variant in dev mode", () => {
    process.env.NODE_ENV = "development";

    const abby = new Abby({
      environments: [""],
      currentEnvironment: "",
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
      environments: [""],
      currentEnvironment: "",
      projectId: "",
      flags: ["flag1"],
    });

    abby.init({
      flags: [{ name: "flag1", value: true }],
      tests: [],
      remoteConfig: [],
    });

    expect(abby.getFeatureFlag("flag1")).toBe(true);

    abby.updateFlag("flag1", false);

    expect(abby.getFeatureFlag("flag1")).toBe(false);
  });

  it("updates local remote config", () => {
    const abby = new Abby({
      environments: [""],
      currentEnvironment: "",
      projectId: "",
      remoteConfig: { remoteConfig1: "String" },
    });

    abby.init({
      flags: [],
      tests: [],
      remoteConfig: [{ name: "remoteConfig1", value: "foo" }],
    });

    expect(abby.getRemoteConfig("remoteConfig1")).toBe("foo");

    abby.updateRemoteConfig("remoteConfig1", "bar");

    expect(abby.getRemoteConfig("remoteConfig1")).toBe("bar");
  });

  it("returns the correct list of all flags", () => {
    const flagInit = [
      {
        name: "a",
        value: true,
      },
      {
        name: "b",
        value: true,
      },
      {
        name: "c",
        value: false,
      },
    ];
    const abby = new Abby({
      environments: ["test"],
      currentEnvironment: "test",
      projectId: "",
      flags: ["a", "b", "c"],
    });

    abby.init({
      flags: flagInit,
      tests: [],
      remoteConfig: [],
    });
    expect(abby.getFeatureFlags()).toEqual(flagInit);
  });

  it("returns the correct list of all remote config variables", () => {
    const configInit = [
      {
        name: "a",
        value: "test",
      },
      {
        name: "b",
        value: 123,
      },
      {
        name: "c",
        value: { a: true },
      },
    ];
    const abby = new Abby({
      environments: ["test"],
      currentEnvironment: "test",
      projectId: "",
      remoteConfig: {
        a: "String",
        b: "Number",
        c: "JSON",
      },
    });

    abby.init({
      flags: [],
      tests: [],
      remoteConfig: configInit,
    });
    expect(abby.getRemoteConfigVariables()).toEqual(configInit);

    const _d = abby.getRemoteConfigVariables();
  });

  it("validates the user properties", () => {
    const abby = new Abby({
      environments: ["test"],
      currentEnvironment: "test",
      projectId: "",
      flags: ["flag1"],
      user: {
        test: validation.string(),
      },
    });

    expect(() => abby.updateUserProperties({ test: 123 as any })).toThrowError(
      "[test]: Expected string but got number"
    );
  });

  it("uses the user rules with AND rule sets", () => {
    const abby = new Abby({
      environments: ["test"],
      currentEnvironment: "test",
      projectId: "",
      flags: ["flag1"],
      user: {
        test: validation.string(),
        isTest: validation.boolean(),
      },
    });

    abby.init({
      flags: [
        {
          name: "flag1",
          value: true,
          ruleSet: [
            {
              operator: "and",
              rules: [
                {
                  propertyName: "test",
                  propertyType: "string",
                  operator: "eq",
                  value: "test",
                },
                {
                  propertyName: "isTest",
                  propertyType: "boolean",
                  operator: "eq",
                  value: true,
                },
              ],
              thenValue: false,
            },
          ],
        },
      ],
      tests: [],
      remoteConfig: [],
    });

    expect(abby.getFeatureFlag("flag1")).toBe(true);

    abby.updateUserProperties({ test: "test", isTest: true });

    expect(abby.getFeatureFlag("flag1")).toBe(false);

    abby.updateUserProperties({ test: "test2", isTest: true });

    expect(abby.getFeatureFlag("flag1")).toBe(true);

    abby.updateUserProperties({ test: "test1", isTest: false });

    expect(abby.getFeatureFlag("flag1")).toBe(true);
  });

  it("uses the user rules with OR rule sets", () => {
    const abby = new Abby({
      environments: ["test"],
      currentEnvironment: "test",
      projectId: "",
      flags: ["flag1"],
      user: {
        test: validation.string(),
        isTest: validation.boolean(),
      },
    });

    abby.init({
      flags: [
        {
          name: "flag1",
          value: true,
          ruleSet: [
            {
              operator: "or",
              rules: [
                {
                  propertyName: "test",
                  propertyType: "string",
                  operator: "eq",
                  value: "test",
                },
                {
                  propertyName: "isTest",
                  propertyType: "boolean",
                  operator: "eq",
                  value: true,
                },
              ],
              thenValue: false,
            },
          ],
        },
      ],
      tests: [],
      remoteConfig: [],
    });

    expect(abby.getFeatureFlag("flag1")).toBe(true);

    abby.updateUserProperties({ test: "test" });

    expect(abby.getFeatureFlag("flag1")).toBe(false);

    abby.updateUserProperties({ test: "test2", isTest: true });

    expect(abby.getFeatureFlag("flag1")).toBe(false);

    abby.updateUserProperties({ test: "test", isTest: false });

    expect(abby.getFeatureFlag("flag1")).toBe(false);
  });

  it("uses the user rules with complex rule sets", () => {
    const abby = new Abby({
      environments: ["test"],
      currentEnvironment: "test",
      projectId: "",
      remoteConfig: {
        remoteConfig1: "String",
      },
      user: {
        test: validation.string(),
        isTest: validation.boolean(),
      },
    });

    abby.init({
      flags: [],
      tests: [],
      remoteConfig: [
        {
          name: "remoteConfig1",
          value: "defaultremoteConfig1",
          ruleSet: [
            {
              propertyName: "test",
              propertyType: "string",
              operator: "eq",
              value: "test",
              thenValue: "isTest",
            },
            {
              propertyName: "test",
              propertyType: "string",
              operator: "contains",
              value: "es",
              thenValue: "containsES",
            },
          ],
        },
      ],
    });

    expect(abby.getRemoteConfig("remoteConfig1")).toBe("defaultremoteConfig1");

    abby.updateUserProperties({
      test: "test",
    });

    expect(abby.getRemoteConfig("remoteConfig1")).toBe("isTest");

    abby.updateUserProperties({
      test: "es",
    });

    expect(abby.getRemoteConfig("remoteConfig1")).toBe("containsES");
  });

  it("uses the user rules with complex rule sets and respects the rule order", () => {
    const abby = new Abby({
      environments: ["test"],
      currentEnvironment: "test",
      projectId: "",
      remoteConfig: {
        remoteConfig1: "String",
      },
      user: {
        test: validation.string(),
        isTest: validation.boolean(),
      },
    });

    abby.init({
      flags: [],
      tests: [],
      remoteConfig: [
        {
          name: "remoteConfig1",
          value: "asdf",
          ruleSet: [
            {
              propertyName: "test",
              propertyType: "string",
              operator: "contains",
              value: "es",
              thenValue: "containsES",
            },
            {
              propertyName: "test",
              propertyType: "string",
              operator: "eq",
              value: "test",
              thenValue: "isTest",
            },
          ],
        },
      ],
    });

    abby.updateUserProperties({
      test: "test",
    });

    expect(abby.getRemoteConfig("remoteConfig1")).toBe("containsES");

    // this means neither of the rules were applied so the default value should be returned
    abby.updateUserProperties({
      test: "abc",
    });

    expect(abby.getRemoteConfig("remoteConfig1")).toBe("asdf");
  });

  it("works with stacked rulesets", () => {
    const abby = new Abby({
      environments: ["test"],
      currentEnvironment: "test",
      projectId: "",
      remoteConfig: {
        remoteConfig1: "String",
      },
      user: {
        test: validation.string(),
        isTest: validation.boolean(),
      },
    });

    abby.init({
      flags: [],
      tests: [],
      remoteConfig: [
        {
          name: "remoteConfig1",
          value: "defaultremoteConfig1",
          ruleSet: [
            {
              propertyName: "test",
              propertyType: "string",
              operator: "eq",
              value: "AB",
              thenValue: "ABmatched",
            },
            {
              operator: "and",
              rules: [
                {
                  propertyName: "test",
                  propertyType: "string",
                  operator: "startsWith",
                  value: "AA",
                },
                {
                  propertyName: "test",
                  propertyType: "string",
                  operator: "endsWith",
                  value: "BB",
                },
              ],
              thenValue: "andMatched",
            },
          ],
        },
      ],
    });

    abby.updateUserProperties({
      test: "AB",
    });

    expect(abby.getRemoteConfig("remoteConfig1")).toBe("ABmatched");

    abby.updateUserProperties({
      test: "AABB",
    });

    expect(abby.getRemoteConfig("remoteConfig1")).toBe("andMatched");

    // this means neither of the rules were applied so the default value should be returned
    abby.updateUserProperties({
      test: "abc",
    });

    expect(abby.getRemoteConfig("remoteConfig1")).toBe("defaultremoteConfig1");
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
