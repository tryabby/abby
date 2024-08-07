import { RemoteConfigValueStringToType } from "../dist";
import { Abby, AbbyConfig } from "../src/index";

describe("types", () => {
  it("produces proper types", () => {
    const abby = new Abby({
      environments: [""],
      currentEnvironment: "",
      projectId: "",
      flags: ["flag1"],
      tests: {
        test1: {
          variants: ["firstVariant", "secondVariant"],
        },
        test2: {
          variants: ["some-random-string", "abc"],
        },
      },
      remoteConfig: { remoteConfig1: "String" },
    });

    assertType<boolean>(abby.getFeatureFlag("flag1"));
    assertType<string>(abby.getRemoteConfig("remoteConfig1"));
    expectTypeOf(abby.getFeatureFlag).parameter(0).toEqualTypeOf<"flag1">();
    expectTypeOf(abby.getRemoteConfig).parameter(0).toEqualTypeOf<"remoteConfig1">();

    assertType<"firstVariant" | "secondVariant">(abby.getTestVariant("test1"));

    expectTypeOf(abby.getTestVariant).parameter(0).toEqualTypeOf<"test1" | "test2">();

    // This is the potential type of the devOverrides
    type DevOverrides = NonNullable<
      NonNullable<
        NonNullable<AbbyConfig<"flag1", {}, ["flag1"]>["settings"]>["flags"]
      >["devOverrides"]
    >;

    expectTypeOf<DevOverrides>().toEqualTypeOf<{
      flag1?: boolean;
    }>();
  });
});

describe("Type Helpers", () => {
  it("converts the strings properly", () => {
    expectTypeOf<RemoteConfigValueStringToType<"String">>().toEqualTypeOf<string>();
    expectTypeOf<RemoteConfigValueStringToType<"JSON">>().toEqualTypeOf<Record<string, unknown>>();
    expectTypeOf<RemoteConfigValueStringToType<"Number">>().toEqualTypeOf<number>();
  });
});
