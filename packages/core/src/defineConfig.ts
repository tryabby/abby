import { F } from "ts-toolbelt";
import { ABConfig, AbbyConfig, FlagValueString } from ".";

export function defineConfig<
  FlagName extends string,
  Tests extends Record<string, ABConfig>,
  Flags extends Record<FlagName, FlagValueString>,
>(config: F.Narrow<AbbyConfig<FlagName, Tests, Flags>>) {
  return config;
}
