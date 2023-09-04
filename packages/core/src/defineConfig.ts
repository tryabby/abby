import { F } from "ts-toolbelt";
import { ABConfig, AbbyConfig } from ".";

export function defineConfig<
  FlagName extends string,
  Tests extends Record<string, ABConfig>,
  Flags extends FlagName[],
>(config: F.Narrow<AbbyConfig<FlagName, Tests, Flags>>) {
  return config;
}
