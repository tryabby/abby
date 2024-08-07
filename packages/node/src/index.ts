import {
  type ABConfig,
  Abby,
  type AbbyConfig,
  type RemoteConfigValueString,
} from "@tryabby/core";
export { defineConfig } from "@tryabby/core";
import { InMemoryStorageService } from "./utils/MemoryStorage";

export function createAbby<
  const FlagName extends string,
  const TestName extends string,
  const Tests extends Record<TestName, ABConfig>,
  const RemoteConfig extends Record<RemoteConfigName, RemoteConfigValueString>,
  const RemoteConfigName extends Extract<keyof RemoteConfig, string>,
>(
  config: AbbyConfig<FlagName, Tests, string[], RemoteConfigName, RemoteConfig>
) {
  const testStorage = new InMemoryStorageService();
  return new Abby(config, testStorage);
}
