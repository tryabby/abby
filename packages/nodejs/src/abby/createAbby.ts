import { ABConfig, Abby, AbbyConfig } from "@tryabby/core";
import { F } from "ts-toolbelt"
import { Request } from "express";
import { TestStorageService } from "./StorageService.ts";

export async function createAbby<
    FlagName extends string,
    TestName extends string,
    Tests extends Record<TestName, ABConfig>,
    ConfigType extends AbbyConfig<FlagName, Tests> = AbbyConfig<FlagName, Tests>
>(abbyConfig: F.Narrow<AbbyConfig<FlagName, Tests>>) {
    const abby = new Abby<FlagName, TestName, Tests>(
        abbyConfig,
        {
            get: (key: string) => {
                return TestStorageService.get(abbyConfig.projectId, key);
            },
            set: (key: string, value: any) => {
                TestStorageService.set(abbyConfig.projectId, key, value)
            },
        },
    );

    //load data and initialise the abby Object
    await abby.loadProjectData();

    /**
     * @param req express request object
     * @param name Name of the test that the variant should be retrieved for
     * @returns Value of the currently selected variant
     */
    const getABTestValue = <T extends keyof Tests>(req: Request, name: T) => {
        const value = abby.getTestVariant(name);
        return value;
    }
    /**
     * 
     * @param name Name of the feature flag
     * @returns Value of the feature flag
     */
    const getFeatureFlagValue = async <F extends NonNullable<ConfigType["flags"]>[number]>(
        name: F
    ) => {
        await abby.loadProjectData();
        return abby.getFeatureFlag(name);
    };

    return { getFeatureFlagValue, getABTestValue }
}