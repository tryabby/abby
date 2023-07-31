import { z } from "zod";
import { AbbyEventType } from "./types";

export const abbyEventSchema = z.object({
  type: z.nativeEnum(AbbyEventType),
  projectId: z.string(),
  testName: z.string(),
  selectedVariant: z.string(),
});

export type AbbyEvent = z.infer<typeof abbyEventSchema>;

export const abbyConfigSchema = z.object({
  projectId: z.string(),
  tests: z.record(
    z.object({
      variants: z.array(z.string()),
    })
  ),
  flags: z.array(z.string()),
});

export const flagValue = z.union([
  z.boolean(),
  z.string(),
  z.number(),
  z.record(z.string(), z.unknown()),
]);

export type FlagValue = z.infer<typeof flagValue>;

export type FlagValueString = "String" | "Boolean" | "Number" | "JSON";

export type FlagValueStringToType<T extends FlagValueString> = T extends "String"
  ? string
  : T extends "Boolean"
  ? boolean
  : T extends "Number"
  ? number
  : T extends "JSON"
  ? Record<string, unknown>
  : never;
