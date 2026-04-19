import type { AbbyConfig } from "@tryabby/core";
import { getFeatureFlag } from "@tryabby/core";
import { readonly, ref, type Ref } from "vue";
import type { UseFeatureFlagReturn } from "./types";

/**
 * Composable for feature flags with Abby
 * @param config - Abby configuration
 * @param name - Feature flag name
 * @returns isEnabled ref
 * @throws If feature flag name is not found in config
 */
export function useFeatureFlag<T extends AbbyConfig>(
  config: T,
  name: keyof T["featureFlags"]
): UseFeatureFlagReturn {
  if (!config) {
    throw new Error("Abby config is required");
  }

  if (!name) {
    throw new Error("Feature flag name is required");
  }

  const flagName = String(name);

  try {
    const isEnabled = ref(
      getFeatureFlag(config, flagName)
    ) as Ref<boolean>;

    return {
      isEnabled: readonly(isEnabled),
    };
  } catch (error) {
    throw new Error(
      `Failed to initialize useFeatureFlag for flag "${flagName}": ${error instanceof Error ? error.message : String(error)}`
    );
  }
}