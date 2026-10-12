import { inject, ref, watchEffect, onUnmounted } from 'vue';
import type { Ref } from 'vue';
import type { ExperimentVariant, FeatureFlagValue, RemoteConfigValue } from '@tryabby/core';
import { ABBY_CLIENT_KEY } from './constants';
import type { UseAbbyResult, UseFeatureFlagResult, UseRemoteConfigResult } from './types';

/**
 * Custom error class for when AbbyClient is not initialized.
 */
class AbbyClientNotInitializedError extends Error {
  constructor(hookName: string) {
    super(`AbbyClient is not initialized. Please ensure you are using ${hookName} within an <AbbyProvider>.`);
    this.name = 'AbbyClientNotInitializedError';
  }
}

/**
 * A composable to access the Abby client context.
 * Throws an error if the client is not provided.
 */
function useAbbyClientContext() {
  const context = inject(ABBY_CLIENT_KEY);
  if (!context || !context.client) {
    throw new AbbyClientNotInitializedError('useAbby, useFeatureFlag, or useRemoteConfig');
  }
  return context;
}

/**
 * `useAbby` is a composable that provides access to the currently selected experiment variant
 * and the `onAct` method for tracking user actions.
 *
 * @returns {UseAbbyResult} An object containing the reactive `variant`, `onAct` method, and `isInitialized` status.
 * @throws {AbbyClientNotInitializedError} If not used within an `AbbyProvider`.
 */
export function useAbby(): UseAbbyResult {
  const { client, isInitialized } = useAbbyClientContext();
  const variant: Ref<ExperimentVariant | null> = ref(null);

  // Update variant reactively when client is initialized or variant changes
  watchEffect(() => {
    if (isInitialized.value && client) {
      variant.value = client.getVariant();
    } else {
      variant.value = null;
    }
  });

  // Expose onAct method
  const onAct = (action: string, metadata?: Record<string, unknown>) => {
    if (!client) {
      console.warn('AbbyClient not available. Cannot call onAct.');
      return;
    }
    client.onAct(action, metadata);
  };

  return {
    variant,
    onAct,
    isInitialized,
  };
}

/**
 * `useFeatureFlag` is a composable that provides the reactive value of a specific feature flag.
 *
 * @param {string} flagName The name of the feature flag.
 * @returns {UseFeatureFlagResult} A reactive ref containing the feature flag's value (boolean or null if not found/initialized).
 * @throws {AbbyClientNotInitializedError} If not used within an `AbbyProvider`.
 */
export function useFeatureFlag(flagName: string): UseFeatureFlagResult {
  const { client, isInitialized } = useAbbyClientContext();
  const flagValue: Ref<FeatureFlagValue | null> = ref(null);

  // Update flag value reactively
  watchEffect(() => {
    if (isInitialized.value && client) {
      flagValue.value = client.getFeatureFlag(flagName);
    } else {
      flagValue.value = null;
    }
  });

  // Optionally, you might want to listen for updates if the core client supports it
  // For now, it relies on `getFeatureFlag` being called on reactivity updates.
  // If the core client has an event emitter for flag changes, we'd subscribe here.
  // For the current core client, `getFeatureFlag` is synchronous and reflects the current state.

  return flagValue;
}

/**
 * `useRemoteConfig` is a composable that provides the reactive value of a specific remote configuration key.
 *
 * @param {string} configKey The key of the remote configuration.
 * @returns {UseRemoteConfigResult} A reactive ref containing the remote config's value (any type or null if not found/initialized).
 * @throws {AbbyClientNotInitializedError} If not used within an `AbbyProvider`.
 */
export function useRemoteConfig(configKey: string): UseRemoteConfigResult {
  const { client, isInitialized } = useAbbyClientContext();
  const configValue: Ref<RemoteConfigValue | null> = ref(null);

  // Update config value reactively
  watchEffect(() => {
    if (isInitialized.value && client) {
      configValue.value = client.getRemoteConfig(configKey);
    } else {
      configValue.value = null;
    }
  });

  // Similar to feature flags, if the core client has an event emitter for config changes,
  // we would subscribe here.

  return configValue;
}

