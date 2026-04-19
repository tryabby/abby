import { computed, type ComputedRef } from 'vue'
import { getRemoteConfig } from '@tryabby/core'
import type { AbbyConfig } from '@tryabby/core'

export function useRemoteConfig<
  T extends AbbyConfig,
  K extends keyof NonNullable<T['remoteConfig']>
>(
  config: T,
  name: K
): ComputedRef<NonNullable<T['remoteConfig']>[K]> {
  return computed(() => {
    return getRemoteConfig(config, name as string) as NonNullable<T['remoteConfig']>[K]
  })
}
