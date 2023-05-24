import { ABBY_AB_STORAGE_PREFIX, ABBY_FF_STORAGE_PREFIX } from "./constants";

export function getABStorageKey(projectId: string, testName: string): string {
  return `${ABBY_AB_STORAGE_PREFIX}${projectId}_${testName}`;
}

export function getFFStorageKey(projectId: string, flagName: string): string {
  return `${ABBY_FF_STORAGE_PREFIX}${projectId}_${flagName}`;
}
