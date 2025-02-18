import { z } from "zod";
import type { AbbyConfig } from "..";
import { AbbyEventType } from "./types";

export const abbyEventSchema = z.object({
  type: z.nativeEnum(AbbyEventType),
  projectId: z.string(),
  testName: z.string(),
  selectedVariant: z.string(),
});

export type AbbyEvent = z.infer<typeof abbyEventSchema>;

export const remoteConfigValue = z.union([
  z.string(),
  z.number(),
  z.record(z.string(), z.unknown()),
]);

export const remoteConfigValueStringSchema = z.union([
  z.literal("String"),
  z.literal("Number"),
  z.literal("JSON"),
]);

const validatorType = z.object({
  type: z.union([
    z.literal("string"),
    z.literal("number"),
    z.literal("boolean"),
  ]),
  optional: z.boolean().optional(),
});

export type ValidatorType = z.infer<typeof validatorType>;

export const abbyConfigSchema = z.object({
  projectId: z.string(),
  apiUrl: z.string().optional(),
  currentEnvironment: z.string(),
  environments: z.array(z.string()),
  tests: z
    .record(
      z.object({
        variants: z.array(z.string()),
      })
    )
    .optional(),
  flags: z.array(z.string()).optional(),
  remoteConfig: z.record(remoteConfigValueStringSchema).optional(),
  settings: z
    .object({
      flags: z
        .object({
          defaultValue: z.boolean().optional(),
          devOverrides: z.record(z.string(), z.boolean()).optional(),
        })
        .optional(),
      remoteConfig: z
        .object({
          defaultValues: z
            .object({
              String: z.string(),
              Number: z.number(),
              JSON: z.record(z.string(), z.unknown()),
            })
            .partial(),
          devOverrides: z.record(z.string(), remoteConfigValue).optional(),
        })
        .optional(),
    })
    .optional(),
  debug: z.boolean().optional(),
  cookies: z
    .object({
      disableByDefault: z.boolean().optional(),
      expiresInDays: z.number().optional(),
    })
    .optional(),
  __experimentalCdnUrl: z.string().optional(),
  user: z.record(z.string(), validatorType).optional(),
}) satisfies z.ZodType<AbbyConfig>;

export type AbbyConfigFile = z.infer<typeof abbyConfigSchema>;

export type PullAbbyConfigResponse = Pick<
  AbbyConfigFile,
  "environments" | "flags" | "tests" | "remoteConfig"
>;

export type RemoteConfigValue = z.infer<typeof remoteConfigValue>;

export type RemoteConfigValueString = z.infer<
  typeof remoteConfigValueStringSchema
>;

export type RemoteConfigValueStringToType<T extends RemoteConfigValueString> =
  T extends "String"
    ? string
    : T extends "Number"
      ? number
      : T extends "JSON"
        ? Record<string, unknown>
        : never;

const flagValueSchema = z.union([
  z.string(),
  z.boolean(),
  z.number(),
  z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
]);

const stringFlagRuleSchema = z.object({
  propertyName: z.string().min(1),
  propertyType: z.literal("string"),
  operator: z.union([
    z.literal("eq"),
    z.literal("neq"),
    z.literal("contains"),
    z.literal("notContains"),
    z.literal("startsWith"),
    z.literal("endsWith"),
    z.literal("regex"),
  ]),
  value: z.string(),
  thenValue: flagValueSchema,
});

const numberFlagRuleSchema = z.object({
  propertyName: z.string().min(1),
  propertyType: z.literal("number"),
  operator: z.union([
    z.literal("eq"),
    z.literal("neq"),
    z.literal("gt"),
    z.literal("gte"),
    z.literal("lt"),
    z.literal("lte"),
  ]),
  value: z.number(),
  thenValue: flagValueSchema,
});

const booleanFlagRuleSchema = z.object({
  propertyName: z.string().min(1),
  propertyType: z.literal("boolean"),
  operator: z.literal("eq"),
  value: z.boolean(),
  thenValue: flagValueSchema,
});

export const flagRuleSchema = z.discriminatedUnion("propertyType", [
  stringFlagRuleSchema,
  numberFlagRuleSchema,
  booleanFlagRuleSchema,
]);

export const subFlagRuleSchema = z.discriminatedUnion("propertyType", [
  stringFlagRuleSchema.omit({ thenValue: true }),
  numberFlagRuleSchema.omit({ thenValue: true }),
  booleanFlagRuleSchema.omit({ thenValue: true }),
]);

export const flagRulesSetSchema = z.array(
  flagRuleSchema.or(
    z.object({
      operator: z.union([z.literal("and"), z.literal("or")]),
      rules: z.array(subFlagRuleSchema).min(1),
      thenValue: flagValueSchema,
    })
  )
);

export type FlagRuleSet = z.infer<typeof flagRulesSetSchema>;
export type FlagRule = z.infer<typeof flagRuleSchema>;
export type SubFlagRule = z.infer<typeof subFlagRuleSchema>;
type StringFlagRule = z.infer<typeof stringFlagRuleSchema>;
type NumberFlagRule = z.infer<typeof numberFlagRuleSchema>;
type BooleanFlagRule = z.infer<typeof booleanFlagRuleSchema>;

export const getOperatorsForType = (type: FlagRule["propertyType"]) => {
  switch (type) {
    case "string":
      return [
        "eq",
        "neq",
        "contains",
        "notContains",
        "startsWith",
        "endsWith",
        "regex",
      ] satisfies Array<StringFlagRule["operator"]>;
    case "number":
      return ["eq", "neq", "gt", "gte", "lt", "lte"] satisfies Array<
        NumberFlagRule["operator"]
      >;
    case "boolean":
      return ["eq"] satisfies Array<BooleanFlagRule["operator"]>;
    default: {
      return [];
    }
  }
};

export const getDisplayNameForOperator = (operator: FlagRule["operator"]) => {
  switch (operator) {
    case "eq":
      return "equals";
    case "neq":
      return "does not equal";
    case "contains":
      return "contains";
    case "notContains":
      return "does not contain";
    case "startsWith":
      return "starts with";
    case "endsWith":
      return "ends with";
    case "regex":
      return "matches regex";
    case "gt":
      return "greater than";
    case "gte":
      return "greater than or equal to";
    case "lt":
      return "less than";
    case "lte":
      return "less than or equal to";
    default: {
      return operator;
    }
  }
};
