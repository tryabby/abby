import type { ValidatorType } from "../shared/schemas";
export type { ValidatorType };

type StringValidatorType = { type: "string" };
type NumberValidatorType = { type: "number" };
type BooleanValidatorType = { type: "boolean" };

export const string = () => ({ type: "string" }) as StringValidatorType;
export const number = () => ({ type: "number" }) as NumberValidatorType;
export const boolean = () => ({ type: "boolean" }) as BooleanValidatorType;

export const optional = <
  T extends StringValidatorType | NumberValidatorType | BooleanValidatorType,
>(
  type: T
) => ({ ...type, optional: true }) as const;

export type Infer<T> = T extends StringValidatorType
  ? T extends { optional: true }
    ? string | null | undefined
    : string
  : T extends NumberValidatorType
    ? T extends { optional: true }
      ? number | null | undefined
      : number
    : T extends BooleanValidatorType
      ? T extends { optional: true }
        ? boolean | null | undefined
        : boolean
      : never;

type Errors = Array<{
  property: string;
  message: string;
}>;

export function validate<T extends Record<string, ValidatorType>>(
  userValidator: T,
  user: Record<string, unknown>
):
  | {
      errors: Errors;
      value?: never;
    }
  | {
      errors?: never;
      value: {
        [key in keyof T]: Infer<T[keyof T]>;
      };
    } {
  const returnObject: {
    [key in keyof T]: Infer<T[keyof T]>;
  } = {} as any;
  const errors: Errors = [];
  for (const key in userValidator) {
    const validator = userValidator[key];
    const value = user[key];

    if (value === undefined && "optional" in validator) {
      continue;
    }

    if (validator.type === "string" && typeof value !== "string") {
      errors.push({
        property: key,
        message: `Expected string but got ${typeof value}`,
      });
    }

    if (validator.type === "number" && typeof value !== "number") {
      errors.push({
        property: key,
        message: `Expected number but got ${typeof value}`,
      });
    }

    if (validator.type === "boolean" && typeof value !== "boolean") {
      errors.push({
        property: key,
        message: `Expected boolean but got ${typeof value}`,
      });
    }
    returnObject[key] = value as Infer<typeof validator>;
  }
  if (errors.length > 0) {
    return { errors };
  }
  return { value: returnObject };
}
