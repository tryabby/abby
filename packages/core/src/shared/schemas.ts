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
