import { z } from "zod";
import { AbbyEventType } from "./types";

export const abbyEventSchema = z.object({
  type: z.nativeEnum(AbbyEventType),
  projectId: z.string(),
  testName: z.string(),
  selectedVariant: z.string(),
});

export type AbbyEvent = z.infer<typeof abbyEventSchema>;

export const flagValueStringSchema = z.union([
  z.literal("String"),
  z.literal("Boolean"),
  z.literal("Number"),
  z.literal("JSON"),
]);

export const abbyConfigSchema = z.object({
  projectId: z.string(),
  tests: z.record(
    z.object({
      variants: z.array(z.string()),
    })
  ),
  flags: z.record(flagValueStringSchema),
});

export type AbbyConfigFile = z.infer<typeof abbyConfigSchema>;

export const flagValue = z.union([
  z.boolean(),
  z.string(),
  z.number(),
  z.record(z.string(), z.unknown()),
]);

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
