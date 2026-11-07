import {
  type ABConfig,
  Abby,
  type AbbyConfig,
  type RemoteConfigValueString,
  type StorageServiceOptions,
  type validation,
} from "@tryabby/core";
import {
  FlagStorageService,
  RemoteConfigStorageService,
  TestStorageService,
} from "./StorageService";
import { createAbbyContext } from "./context";

export {
  type ABConfig,
  type AbbyConfig,
  defineConfig,
  validation as v,
} from "@tryabby/core";
export type { ABTestReturnValue, AbbyProviderServerData } from "./context";

// Creates a typed Abby instance bound to browser cookie storage and Vue 3 reactive composables.
export function createAbby<
  const FlagName extends string,
  const TestName extends string,
  const Tests extends Record<TestName, ABConfig>,
  const RemoteConfig extends Record<RemoteConfigName, RemoteConfigValueString>,
  const RemoteConfigName extends Extract<keyof RemoteConfig, string>,
  const Environments extends Array<string> = Array<string>,
  const User extends Record<string, validation.ValidatorType> = Record<
    string,
    validation.ValidatorType
  >,
>(
  config: AbbyConfig<
    FlagName,
    Tests,
    Environments,
    RemoteConfigName,
    RemoteConfig,
    User
  >
) {
  const abby = new Abby<
    FlagName,
    TestName,
    Tests,
    RemoteConfig,
    RemoteConfigName,
    Environments,
    User
  >(
    config,
    {
      get: (key: string) =>
        TestStorageService.get({ projectId: config.projectId, key }),
      set: (key: string, value: string, options?: StorageServiceOptions) =>
        TestStorageService.set({
          projectId: config.projectId,
          key,
          value,
          options,
        }),
    },
    {
      get: (key: string) =>
        FlagStorageService.get({ projectId: config.projectId, key }),
      set: (key: string, value: string) =>
        FlagStorageService.set({ projectId: config.projectId, key, value }),
    },
    {
      get: (key: string) =>
        RemoteConfigStorageService.get({ projectId: config.projectId, key }),
      set: (key: string, value: string) =>
        RemoteConfigStorageService.set({
          projectId: config.projectId,
          key,
          value,
        }),
    }
  );

  if (typeof window !== "undefined") {
    void abby.loadProjectData();
  }

  return createAbbyContext(abby, {
    projectId: config.projectId,
    apiUrl: config.apiUrl,
  });
}
