import { ABConfig, Abby, AbbyConfig, HttpService, ABBY_BASE_URL } from "@tryabby/core";
import { F } from "ts-toolbelt"
import { Request } from "express";
import { TestStorageService } from "./StorageService.ts";

export function createAbby<
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

            },
        },
    );

    const getABTestValue = <T extends keyof Tests>(req: Request, name: T) => {
        const value = abby.getTestVariant(name);
        return value;
    }

    const getFeatureFlagValue = async <F extends NonNullable<ConfigType["flags"]>[number]>(
        name: F
    ) => {
        await abby.loadProjectData();
        return abby.getFeatureFlag(name);
    };

    return { getFeatureFlagValue, getABTestValue }
}