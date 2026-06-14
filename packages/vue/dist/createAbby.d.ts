import { ABConfig, RemoteConfigValueString, ValidatorType, AbbyConfig, RemoteConfigValueStringToType, Abby } from '@tryabby/core';
import { Infer } from '@tryabby/core/validation';
import { ComputedRef } from 'vue';

type ABTestReturnValue<Lookup, TestVariant> = Lookup extends undefined ? TestVariant : TestVariant extends keyof Lookup ? Lookup[TestVariant] : never;
declare function createAbby<const FlagName extends string, const TestName extends string, const Tests extends Record<TestName, ABConfig>, const RemoteConfig extends Record<RemoteConfigName, RemoteConfigValueString>, const RemoteConfigName extends Extract<keyof RemoteConfig, string>, const User extends Record<string, ValidatorType> = Record<string, ValidatorType>>(abbyConfig: AbbyConfig<FlagName, Tests, string[], RemoteConfigName, RemoteConfig, User>): {
    useAbby: <K extends keyof Tests, TestVariant extends Tests[K]["variants"][number], LookupValue, const Lookup extends Record<TestVariant, LookupValue> | undefined = undefined>(name: K, lookupObject?: Lookup) => {
        variant: ComputedRef<ABTestReturnValue<Lookup, TestVariant>>;
        onAct: () => void;
    };
    AbbyProvider: {
        name: string;
        props: {
            initialData: {
                type: ObjectConstructor;
                default: undefined;
            };
        };
        setup(props: any, { slots }: any): () => any;
    };
    useFeatureFlag: (name: FlagName) => ComputedRef<boolean>;
    getFeatureFlagValue: (name: FlagName) => boolean;
    useRemoteConfig: <T extends RemoteConfigName, Config extends RemoteConfig[T]>(remoteConfigName: T) => ComputedRef<RemoteConfigValueStringToType<Config>>;
    getRemoteConfig: <T extends RemoteConfigName, Config extends RemoteConfig[T]>(remoteConfigName: T) => RemoteConfigValueStringToType<Config>;
    getABTestValue: <TestName_1 extends keyof Tests, TestVariant extends Tests[TestName_1]["variants"][number], LookupValue, const Lookup extends Record<TestVariant, LookupValue> | undefined = undefined>(testName: TestName_1, lookupObject?: Lookup) => ABTestReturnValue<Lookup, TestVariant>;
    __abby__: Abby<FlagName, TestName, Tests, RemoteConfig, RemoteConfigName, string[], User>;
    getABResetFunction: <T extends keyof Tests>(name: T) => () => void;
    getVariants: <T extends keyof Tests>(name: T) => Tests[T]["variants"];
    useFeatureFlags: () => ComputedRef<{
        name: FlagName;
        value: any;
    }[]>;
    useRemoteConfigVariables: () => ComputedRef<{
        name: RemoteConfigName;
        value: any;
    }[]>;
    updateUserProperties: (user: Partial<{ -readonly [K in keyof User]: Infer<User[K]>; }>) => void;
};

export { ABTestReturnValue, createAbby };
