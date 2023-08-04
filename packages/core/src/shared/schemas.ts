import { z } from "zod";
import { AbbyEventType } from "./types";

export const abbyEventSchema = z.object({
  type: z.nativeEnum(AbbyEventType),
  projectId: z.string(),
  testName: z.string(),
  selectedVariant: z.string(),
});

export type AbbyEvent = z.infer<typeof abbyEventSchema>;

export const flagValue = z.union([
  z.boolean(),
  z.string(),
  z.number(),
  z.record(z.string(), z.unknown()),
]);

export const flagValueStringSchema = z.union([
  z.literal("String"),
  z.literal("Boolean"),
  z.literal("Number"),
  z.literal("JSON"),
]);

export const abbyConfigSchema = z.object({
  projectId: z.string(),
  apiUrl: z.string().optional(),
  currentEnvironment: z.string().optional(),
  environments: z.array(z.string()),
  tests: z.record(
    z.object({
      variants: z.array(z.string()),
    })
  ),
  flags: z.record(flagValueStringSchema),
  settings: z
    .object({
      flags: z
        .object({
          defaultValues: z.record(z.string(), flagValue).optional(),
          devOverrides: z.record(z.string(), flagValue).optional(),
        })
        .optional(),
    })
    .optional(),
  debug: z.boolean().optional(),
});

export type AbbyConfigFile = z.infer<typeof abbyConfigSchema>;

export type PullAbbyConfigResponse = Pick<AbbyConfigFile, "environments" | "flags" | "tests">;

export type FlagValue = z.infer<typeof flagValue>;

export type FlagValueString = z.infer<typeof flagValueStringSchema>;

export type FlagValueStringToType<T extends FlagValueString> = T extends "String"
  ? string
  : T extends "Boolean"
  ? boolean
  : T extends "Number"
  ? number
  : T extends "JSON"
  ? Record<string, unknown>
  : never;
