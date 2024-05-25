// packages/vue/@tryabby/vue/src/useFeatureFlag.ts
import { ref, onMounted } from 'vue';
import { getFeatureFlag } from '@tryabby/core';

export function useFeatureFlag(flagName: string) {
  const flagValue = ref<boolean | null>(null);

  onMounted(() => {
    flagValue.value = getFeatureFlag(flagName);
  });

  return { flagValue };
}
