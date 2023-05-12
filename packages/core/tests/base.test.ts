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

  it("gets a feature flag", () => {
    const abby = new Abby({
      projectId: "",
      flags: ["flag1", "flag2"],
    });

    expect(abby.getFeatureFlag("flag1")).toBeDefined();
    expect(abby.getFeatureFlag("flag2")).toBeDefined();
  });

  it("uses the devOverrides", () => {
    const abby = new Abby({
      projectId: "",
      flags: ["flag1", "flag2"],
      settings: {
        flags: {
          devOverrides: {
            flag1: false,
          },
        },
      },
    });

    abby.init({ flags: [{ name: "flag1", isEnabled: true }], tests: [] });

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
      flags: ["flag1", "flag2"],
    });

    abby.init({ flags: [{ name: "flag1", isEnabled: true }], tests: [] });

    expect(abby.getFeatureFlag("flag1")).toBe(true);

    abby.updateFlag("flag1", false);

    expect(abby.getFeatureFlag("flag1")).toBe(false);
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
