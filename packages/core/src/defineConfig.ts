import { F } from "ts-toolbelt";
import { ABConfig, AbbyConfig, RemoteConfigValueString } from ".";

export const DYNAMIC_ABBY_CONFIG_KEYS = [
  "projectId",
  "currentEnvironment",
  "debug",
  "apiUrl",
  "__experimentalCdnUrl",
] as const satisfies readonly (keyof AbbyConfig)[];

export type DynamicConfigKeys = (typeof DYNAMIC_ABBY_CONFIG_KEYS)[number];

export function defineConfig<
  FlagName extends string,
  Tests extends Record<string, ABConfig>,
  RemoteConfig extends Record<RemoteConfigName, RemoteConfigValueString>,
  RemoteConfigName extends Extract<keyof RemoteConfig, string>,
>(
  dynamicConfig: F.Narrow<
    Pick<AbbyConfig<FlagName, Tests, string[], RemoteConfigName, RemoteConfig>, DynamicConfigKeys>
  >,
  config: F.Narrow<
    Omit<AbbyConfig<FlagName, Tests, string[], RemoteConfigName, RemoteConfig>, DynamicConfigKeys>
  >
) {
  return { ...dynamicConfig, ...config };
}
