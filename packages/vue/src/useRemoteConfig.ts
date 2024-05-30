import { onMounted, ref } from 'vue';
import { getConfig } from '@tryabby/core';

export function useRemoteConfig(configName: string) {
  const configValue = ref<any>(null);

  onMounted(() => {
    configValue.value = getConfig(configName);
  });

  return {
    configValue
  };
}
