import { onMounted, ref } from 'vue';
import { getFlag } from '@tryabby/core';

export function useFeatureFlag(flagName: string) {
  const flagValue = ref<boolean | null>(null);

  onMounted(() => {
    flagValue.value = getFlag(flagName);
  });

  return {
    flagValue
  };
}
