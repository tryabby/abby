import { ABConfig, Abby, AbbyConfig, HttpService, ABBY_BASE_URL } from "@tryabby/core";
import { F } from "ts-toolbelt"

export function createAbby<
    FlagName extends string,
    TestName extends string,
    Tests extends Record<TestName, ABConfig>,
    ConfigType extends AbbyConfig<FlagName, Tests> = AbbyConfig<FlagName, Tests>
>(abbyConfig: F.Narrow<AbbyConfig<FlagName, Tests>>) {
    const abby = new Abby<FlagName, TestName, Tests>(
        abbyConfig
    );

    const useFeatureFlag = async <F extends NonNullable<ConfigType["flags"]>[number]>(
        name: F
    ) => {   
        console.log(2)
        return true
    };

    return { useFeatureFlag }
}