import { onMounted, ref } from 'vue';
import { getCurrentVariant, onAct } from '@tryabby/core';

export function useAbby(experimentName: string) {
  const variant = ref<string | null>(null);

  onMounted(() => {
    variant.value = getCurrentVariant(experimentName);
  });

  return {
    variant,
    onAct
  };
}
a