import { ABConfig, Abby, AbbyConfig , FlagValueString, FlagValueStringToType } from "@tryabby/core";
import { F } from "ts-toolbelt";
import { TestStorageService } from "./StorageService.ts";

export async function  createAbby<
  FlagName extends string,
  TestName extends string,
  Tests extends Record<TestName, ABConfig>,
  Flags extends Record<FlagName, FlagValueString> = Record<FlagName, FlagValueString>,
  ConfigType extends AbbyConfig<FlagName, Tests> = AbbyConfig<FlagName, Tests>
>(abbyConfig: F.Narrow<AbbyConfig<FlagName, Tests, Flags>>) {
  const abbyCoreInstance = new Abby<FlagName, TestName, Tests, Flags>(abbyConfig, {
    get: (key: string) => {
      return TestStorageService.get(abbyConfig.projectId, key);
    },
    set: (key: string, value: any) => {
      TestStorageService.set(abbyConfig.projectId, key, value);
    },
  });

  //load data and initialise the abby Object
  await abbyCoreInstance.loadProjectData();

  const config = abbyConfig as unknown as ConfigType;
  
  /**
   * @param name Name of the test that the variant should be retrieved for
   * @returns Value of the currently selected variant
   */
  const getABTestValue = <T extends keyof Tests>(name: T) => {
    const value = abbyCoreInstance.getTestVariant(name);
    return value;
  };
  /**
   *
   * @param name Name of the feature flag
   * @returns Value of the feature flag
   */
  const getFeatureFlagValue = <
    F extends keyof Flags
  >(
    name: F
  ) => {
    return abbyCoreInstance.getFeatureFlag(name);
  };

  return { getFeatureFlagValue, getABTestValue };
}
