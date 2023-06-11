import { z } from "zod";
import { AbbyEventType } from "./types";

export const abbyEventSchema = z.object({
  type: z.nativeEnum(AbbyEventType),
  projectId: z.string(),
  testName: z.string(),
  selectedVariant: z.string(),
});

export type AbbyEvent = z.infer<typeof abbyEventSchema>;

export const flagValue = z.union([z.boolean(), z.string(), z.number()]);

export type FlagValue = z.infer<typeof flagValue>;

export type FlagValueString = "String" | "Boolean" | "Number";

export type FlagValueStringToType<T extends FlagValueString> =
  T extends "String"
    ? string
    : T extends "Boolean"
    ? boolean
    : T extends "Number"
    ? number
    : never;
