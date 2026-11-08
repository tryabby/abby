import { ABConfig, RemoteConfigValueString, ValidatorType, AbbyConfig, RemoteConfigValueStringToType, Abby } from '@tryabby/core';
export { ABConfig, AbbyConfig, defineConfig } from '@tryabby/core';
import { ComputedRef } from 'vue';

type ABTestReturnValue<Lookup, TestVariant> = Lookup extends undefined ? TestVariant : TestVariant extends keyof Lookup ? Lookup[TestVariant] : never;
declare function createAbby<const FlagName extends string, const TestName extends string, const Tests extends Record<TestName, ABConfig>, const RemoteConfig extends Record<RemoteConfigName, RemoteConfigValueString>, const RemoteConfigName extends Extract<keyof RemoteConfig, string>, const User extends Record<string, ValidatorType> = Record<string, ValidatorType>>(config: AbbyConfig<FlagName, Tests, string[], RemoteConfigName, RemoteConfig, User>): {
    useAbby: <K extends keyof Tests, TestVariant extends Tests[K]["variants"][number], LookupValue, const Lookup extends Record<TestVariant, LookupValue> | undefined = undefined>(name: K, lookupObject?: Lookup) => {
        variant: ComputedRef<ABTestReturnValue<Lookup, TestVariant>>;
        onAct: () => void;
    };
    useFeatureFlag: (name: FlagName) => ComputedRef<boolean>;
    useRemoteConfig: <T extends RemoteConfigName>(name: T) => ComputedRef<RemoteConfigValueStringToType<RemoteConfig[T]>>;
    __abby__: Abby<FlagName, TestName, Tests, RemoteConfig, RemoteConfigName, string[], User>;
};

export { ABTestReturnValue, createAbby };
