import { inject, provide, reactive } from 'vue';

const AbbySymbol = Symbol();

export function provideAbby(abby) {
    const state = reactive({
        flags: abby.getFeatureFlags(),
        tests: abby.getTests(),
    });

    provide(AbbySymbol, state);
}

export function useFeatureFlag(flagName) {
    const abby = inject(AbbySymbol);
    if (!abby) {
        throw new Error("useFeatureFlag must be used within a component that provides Abby data.");
    }
    return abby.flags[flagName];
}
