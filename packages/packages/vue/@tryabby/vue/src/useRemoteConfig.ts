// packages/vue/@tryabby/vue/src/useRemoteConfig.ts
import { ref, onMounted } from 'vue';
import { getRemoteConfig } from '@tryabby/core';

export function useRemoteConfig(configKey: string) {
  const configValue = ref<any>(null);

  onMounted(() => {
    configValue.value = getRemoteConfig(configKey);
  });

  return { configValue };
}
