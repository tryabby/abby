import * as validation from "../src/validation";

describe("validation", () => {
  it("produces proper types", () => {
    const booleanValidation = validation.boolean();
    expectTypeOf<
      validation.Infer<typeof booleanValidation>
    >().toEqualTypeOf<boolean>();

    const stringValidation = validation.string();
    expectTypeOf<
      validation.Infer<typeof stringValidation>
    >().toEqualTypeOf<string>();

    const numberValidation = validation.number();
    expectTypeOf<
      validation.Infer<typeof numberValidation>
    >().toEqualTypeOf<number>();

    const optionalNumberValidation = validation.optional(validation.number());

    expectTypeOf<
      validation.Infer<typeof optionalNumberValidation>
    >().toEqualTypeOf<number | undefined | null>();

    const optionalStringValidation = validation.optional(validation.string());

    expectTypeOf<
      validation.Infer<typeof optionalStringValidation>
    >().toEqualTypeOf<string | undefined | null>();

    const optionalBooleanValidation = validation.optional(validation.boolean());

    expectTypeOf<
      validation.Infer<typeof optionalBooleanValidation>
    >().toEqualTypeOf<boolean | undefined | null>();
  });

  it("validates properly", () => {
    const userValidator = {
      name: validation.string(),
      age: validation.number(),
      isDeveloper: validation.boolean(),
    };

    const user = {
      name: "John",
      age: 25,
      isDeveloper: true,
    };
    expect(validation.validate(userValidator, user)).toEqual({
      value: user,
    });
  });

  it("validates properly with optional fields", () => {
    const userValidator = {
      name: validation.string(),
      age: validation.optional(validation.number()),
      isDeveloper: validation.boolean(),
    };
    const user = {
      name: "John",
      isDeveloper: true,
    };
    expect(validation.validate(userValidator, user)).toEqual({
      value: user,
    });
  });

  it("shows errors properly", () => {
    const userValidator = {
      name: validation.string(),
      age: validation.number(),
      isDeveloper: validation.boolean(),
    };
    const user = {
      name: "John",
      age: "25",
      isDeveloper: true,
    };
    expect(validation.validate(userValidator, user)).toEqual({
      errors: [
        {
          property: "age",
          message: "Expected number but got string",
        },
      ],
    });
  });
});
