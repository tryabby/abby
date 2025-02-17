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

export type ValidationErrors = Array<{
  property: string;
  message: string;
}>;

export function validateProperty<T extends ValidatorType>(
  property: T,
  value: unknown
): string | undefined {
  if (value === undefined && "optional" in property) {
    return;
  }

  if (property.type === "string" && typeof value !== "string") {
    return `Expected string but got ${typeof value}`;
  }

  if (property.type === "number" && typeof value !== "number") {
    return `Expected number but got ${typeof value}`;
  }

  if (property.type === "boolean" && typeof value !== "boolean") {
    return `Expected boolean but got ${typeof value}`;
  }
}

export function validate<T extends Record<string, ValidatorType>>(
  userValidator: T,
  user: Record<string, unknown>
):
  | {
      errors: ValidationErrors;
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
  const errors: ValidationErrors = [];
  for (const key in userValidator) {
    const validator = userValidator[key];
    const value = user[key];

    const error = validateProperty(validator, value);
    if (error) {
      errors.push({
        property: key,
        message: error,
      });
      continue;
    }

    returnObject[key] = value as Infer<T[typeof key]>;
  }
  if (errors.length > 0) {
    return { errors };
  }
  return { value: returnObject };
}
