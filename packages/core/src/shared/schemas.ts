import { z } from "zod";
import { AbbyEventType } from "./types";
import { AbbyConfig } from "..";

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
}) satisfies z.ZodType<AbbyConfig>;

export type AbbyConfigFile = z.infer<typeof abbyConfigSchema>;

export type PullAbbyConfigResponse = Pick<
  AbbyConfigFile,
  "environments" | "flags" | "tests" | "remoteConfig"
>;

export type RemoteConfigValue = z.infer<typeof remoteConfigValue>;

export type RemoteConfigValueString = z.infer<typeof remoteConfigValueStringSchema>;

export type RemoteConfigValueStringToType<T extends RemoteConfigValueString> = T extends "String"
  ? string
  : T extends "Number"
    ? number
    : T extends "JSON"
      ? Record<string, unknown>
      : never;
