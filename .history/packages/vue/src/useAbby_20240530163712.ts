import { onMounted, ref } from 'vue';
import { getVariant, onAct } from '@tryabby/core';

export function useAbby(experimentName: string) {
  const variant = ref<string | null>(null);

  onMounted(() => {
    variant.value = getVariant(experimentName);
  });

  return {
    variant,
    onAct
  };
}
