import { F } from "ts-toolbelt";
import { ABConfig, AbbyConfig, RemoteConfigValueString } from ".";

export function defineConfig<
  FlagName extends string,
  Tests extends Record<string, ABConfig>,
  RemoteConfig extends Record<RemoteConfigName, RemoteConfigValueString>,
  RemoteConfigName extends Extract<keyof RemoteConfig, string>,
>(config: F.Narrow<AbbyConfig<FlagName, Tests, string[], RemoteConfigName, RemoteConfig>>) {
  return config;
}
