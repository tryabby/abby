import { ABConfig, Abby, AbbyConfig, RemoteConfigValueString } from "@tryabby/core";
export { defineConfig } from "@tryabby/core";
import { F } from "ts-toolbelt";
import { InMemoryStorageService } from "./utils/MemoryStorage";

export function createAbby<
  FlagName extends string,
  TestName extends string,
  Tests extends Record<TestName, ABConfig>,
  RemoteConfig extends Record<RemoteConfigName, RemoteConfigValueString>,
  RemoteConfigName extends Extract<keyof RemoteConfig, string>,
>(config: F.Narrow<AbbyConfig<FlagName, Tests, string[], RemoteConfigName, RemoteConfig>>) {
  const testStorage = new InMemoryStorageService();
  return new Abby(config, testStorage);
}
