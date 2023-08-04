import { Abby } from "../dist";
import { defineConfig } from "../src/defineConfig";

describe("defineConfig", () => {
  const cfg = defineConfig({
    projectId: "xd",
    environments: ["development", "production"],
    flags: {
      a: "Boolean",
      b: "String",
      c: "Number",
      d: "JSON",
    },
    tests: {
      abTest: {
        variants: ["true", "false"],
      },
    },
  });

  const abby = new Abby(cfg);

  it("produces proper types", () => {
    expectTypeOf(abby.getFeatureFlag).parameter(0).toEqualTypeOf<"a" | "b" | "c" | "d">();
    expectTypeOf(abby.getFeatureFlag("a")).toEqualTypeOf<boolean>();
    expectTypeOf(abby.getFeatureFlag("b")).toEqualTypeOf<string>();
    expectTypeOf(abby.getFeatureFlag("c")).toEqualTypeOf<number>();
    expectTypeOf(abby.getFeatureFlag("d")).toEqualTypeOf<Record<string, unknown>>();

    expectTypeOf(abby.getVariants).parameter(0).toEqualTypeOf<"abTest">();
  });
});
