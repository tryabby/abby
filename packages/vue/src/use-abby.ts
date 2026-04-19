import type { AbbyConfig } from "@tryabby/core";
import { getVariant, getAct } from "@tryabby/core";
import { computed, readonly, ref, type Ref } from "vue";
import type { UseAbbyReturn } from "./types";

/**
 * Composable for A/B testing with Abby
 * @param config - Abby configuration
 * @param name - Test name
 * @returns Variant and onAct function
 * @throws If test name is not found in config
 */
export function useAbby<T extends AbbyConfig>(
  config: T,
  name: keyof T["tests"]
): UseAbbyReturn<T> {
  if (!config) {
    throw new Error("Abby config is required");
  }

  if (!name) {
    throw new Error("Test name is required");
  }

  const testName = String(name);
  
  try {
    const variant = ref(getVariant(config, testName)) as Ref<any>;
    const actFn = getAct(config);

    const onAct = (data?: Record<string, unknown>) => {
      if (!actFn) {
        console.warn("Act function not available in Abby config");
        return;
      }
      actFn(testName, data);
    };

    return {
      variant: readonly(variant),
      onAct,
    };
  } catch (error) {
    throw new Error(
      `Failed to initialize useAbby for test "${testName}": ${error instanceof Error ? error.message : String(error)}`
    );
  }
}