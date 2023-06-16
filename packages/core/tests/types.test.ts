import { AbbyConfig } from "../dist";
import { Abby } from "../src/index";

describe("types", () => {
  it("produces proper types", () => {
    const abby = new Abby({
      config: {
        projectId: "",
        flags: ["flag1", "flag2"],
        tests: {
          test1: {
            variants: ["firstVariant", "secondVariant"],
          },
          test2: {
            variants: ["some-random-string", "abc"],
          },
        },
      },
    });

    assertType<boolean>(abby.getFeatureFlag("flag1"));
    expectTypeOf(abby.getFeatureFlag).parameter(0).toEqualTypeOf<"flag1" | "flag2">();

    assertType<"firstVariant" | "secondVariant">(abby.getTestVariant("test1"));

    expectTypeOf(abby.getTestVariant).parameter(0).toEqualTypeOf<"test1" | "test2">();

    // This is the potential type of the devOverrides
    type DevOverrides = NonNullable<
      NonNullable<
        NonNullable<AbbyConfig<"flag1" | "flag2", {}>["settings"]>["flags"]
      >["devOverrides"]
    >;

    expectTypeOf<DevOverrides>().toEqualTypeOf<{
      flag1?: boolean;
      flag2?: boolean;
    }>();
  });
});
