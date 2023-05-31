import { ABConfig, Abby, AbbyConfig, HttpService, ABBY_BASE_URL } from "@tryabby/core";
import { F } from "ts-toolbelt"
// import fetch from 'node-fetch';

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
        // const res = await fetch(
        //     `${ABBY_BASE_URL}api/dashboard/${abbyConfig.projectId}/data`
        // );
        console.log(2)
        return true
        // await abby.loadProjectData()
        // return abby.getFeatureFlag(name);
    };

    return { useFeatureFlag }
}