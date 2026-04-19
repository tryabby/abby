import type { AbbyConfig } from "@tryabby/core";
import type { ComputedRef, Ref } from "vue";

export interface UseAbbyOptions<T extends AbbyConfig = AbbyConfig> {
  config: T;
}

export interface UseFeatureFlagOptions<T extends AbbyConfig = AbbyConfig> {
  config: T;
}

export interface UseRemoteConfigOptions<T extends AbbyConfig = AbbyConfig> {
  config: T;
}

export interface UseAbbyReturn<T extends AbbyConfig = AbbyConfig> {
  variant: Readonly<Ref<string>>;
  onAct: (data?: Record<string, unknown>) => void;
}

export interface UseFeatureFlagReturn {
  isEnabled: Readonly<Ref<boolean>>;
}

export type UseRemoteConfigReturn<T = unknown> = ComputedRef<T>;
