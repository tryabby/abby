import { ref, onMounted } from 'vue';
import { createAbby } from '@tryabby/core';
import type { ABTestReturnValue } from '@tryabby/core';

export function useAbby(experimentName: string): ABTestReturnValue {
  const abby = createAbby();
  const variant = ref<string | null>(null);

  onMounted(() => {
    variant.value = abby.getVariant(experimentName);
  });

  return {
    variant,
    onAct: abby.onAct
  };
}
