import { F } from "ts-toolbelt";
import { ABConfig, AbbyConfig, RemoteConfigValueString } from ".";

export function defineConfig<
  FlagName extends string,
  Tests extends Record<string, ABConfig>,
  Flags extends FlagName[],
  RemoteConfigName extends string,
  RemoteConfig extends Record<RemoteConfigName, RemoteConfigValueString>,
>(config: F.Narrow<AbbyConfig<FlagName, Tests, Flags, string[], RemoteConfigName, RemoteConfig>>) {
  return config;
}
