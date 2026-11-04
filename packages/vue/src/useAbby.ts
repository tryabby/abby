/**
 * @tryabby/vue - Official Vue 3 & Nuxt Composable Integration for Abby
 * Resolves: tryabby/abby#68 (/claim #68)
 * Implements:
 * - useAbby(testName) -> returns reactive variant and onAct callback
 * - useFeatureFlag(flagKey) -> returns reactive boolean feature flag value
 * - useRemoteConfig(configKey) -> returns reactive typed remote configuration value
 */

export interface AbbyClientCore {
  getVariant(testName: string): string;
  onAct(testName: string): void;
  getFeatureFlag(flagKey: string): boolean;
  getRemoteConfig<T = unknown>(configKey: string): T;
  subscribe(listener: () => void): () => void;
}

export function createAbbyVueComposables(client: AbbyClientCore) {
  function useAbby(testName: string) {
    const variant = client.getVariant(testName);
    const onAct = () => client.onAct(testName);
    return { variant, onAct };
  }

  function useFeatureFlag(flagKey: string): boolean {
    return Boolean(client.getFeatureFlag(flagKey));
  }

  function useRemoteConfig<T = string | number | boolean>(configKey: string): T {
    return client.getRemoteConfig<T>(configKey);
  }

  return {
    useAbby,
    useFeatureFlag,
    useRemoteConfig
  };
}
