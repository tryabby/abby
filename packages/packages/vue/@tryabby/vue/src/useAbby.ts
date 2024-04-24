// packages/vue/@tryabby/vue/src/useAbby.ts
import { ref, onMounted } from 'vue';
import { getVariant, onAct } from '@tryabby/core';

export function useAbby(experimentId: string) {
  const variant = ref<string | null>(null);

  onMounted(() => {
    variant.value = getVariant(experimentId);
  });

  return { variant, onAct };
}
