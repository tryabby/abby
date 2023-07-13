import { ABConfig, Abby, AbbyConfig, FlagValueString, FlagValueStringToType } from "@tryabby/core";
import { F } from "ts-toolbelt";
import { TestStorageService } from "../shared/StorageService";
import { FastifyRequest } from "fastify";

export function createAbby<
  FlagName extends string,
  TestName extends string,
  Tests extends Record<TestName, ABConfig>,
  Flags extends Record<FlagName, FlagValueString> = Record<FlagName, FlagValueString>,
  ConfigType extends AbbyConfig<FlagName, Tests> = AbbyConfig<FlagName, Tests>,
>(abbyConfig: F.Narrow<AbbyConfig<FlagName, Tests, Flags>>) {
  const abbyCoreInstance = new Abby<FlagName, TestName, Tests, Flags>(abbyConfig, {
    get: (key: keyof Tests) => {
      return TestStorageService.get(abbyConfig.projectId, key as string);
    },
    set: (key: keyof Tests, value: any) => {
      TestStorageService.set(abbyConfig.projectId, key as string, value);
    },
  });

  //load data and initialise the abby Object
  abbyCoreInstance.loadProjectData();

  const config = abbyConfig as unknown as ConfigType;

  /**
   * @param name Name of the test that the variant should be retrieved for
   * @returns Value of the currently selected variant
   */
  const getABTestValue = <T extends keyof Tests>(name: T, req: FastifyRequest) => {
    const value = abbyCoreInstance.getTestVariant(name);
    return value;
  };
  /**
   *
   * @param name Name of the feature flag
   * @returns Value of the feature flag
   */
  const getFeatureFlagValue = <F extends keyof Flags>(name: F) => {
    return abbyCoreInstance.getFeatureFlag(name);
  };

  return { getFeatureFlagValue, getABTestValue };
}
