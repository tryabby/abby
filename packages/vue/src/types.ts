import type { AbbyClient, AbbyConfig, ExperimentVariant, FeatureFlagValue, RemoteConfigValue } from '@tryabby/core';
import type { Ref } from 'vue';

/**
 * Interface for the Abby client context provided by AbbyProvider.
 */
export interface AbbyClientContext {
  client: AbbyClient | null;
  isInitialized: Ref<boolean>;
}

/**
 * Type for the return value of useAbby.
 */
export interface UseAbbyResult {
  variant: Ref<ExperimentVariant | null>;
  onAct: (action: string, metadata?: Record<string, unknown>) => void;
  isInitialized: Ref<boolean>;
}

/**
 * Type for the return value of useFeatureFlag.
 */
export type UseFeatureFlagResult = Ref<FeatureFlagValue | null>;

/**
 * Type for the return value of useRemoteConfig.
 */
export type UseRemoteConfigResult = Ref<RemoteConfigValue | null>;

