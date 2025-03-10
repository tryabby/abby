import { Abby } from "../src";
import { defineConfig } from "../src/defineConfig";
import * as validation from "../src/validation";

describe("defineConfig", () => {
  const cfg = defineConfig(
    { projectId: "xd", currentEnvironment: "development" },
    {
      environments: ["development", "production"],
      flags: ["a"],
      remoteConfig: {
        b: "String",
        c: "Number",
        d: "JSON",
      },
      tests: {
        abTest: {
          variants: ["true", "false"],
        },
      },
      user: {
        name: validation.string(),
        age: validation.number(),
        isDeveloper: validation.boolean(),
      },
    }
  );

  const abby = new Abby(cfg);

  it("produces proper types", () => {
    expectTypeOf(abby.getFeatureFlag).parameter(0).toEqualTypeOf<"a">();
    expectTypeOf(abby.getFeatureFlag("a")).toEqualTypeOf<boolean>();
    expectTypeOf(abby.getRemoteConfig("b")).toEqualTypeOf<string>();
    expectTypeOf(abby.getRemoteConfig("c")).toEqualTypeOf<number>();
    expectTypeOf(abby.getRemoteConfig("d")).toEqualTypeOf<
      Record<string, unknown>
    >();

    expectTypeOf(abby.getVariants).parameter(0).toEqualTypeOf<"abTest">();
    expectTypeOf(abby.updateUserProperties).parameter(0).toEqualTypeOf<{
      name?: string;
      age?: number;
      isDeveloper?: boolean;
    }>();
  });
});
