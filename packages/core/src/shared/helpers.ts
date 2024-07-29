import {
  ABBY_AB_STORAGE_PREFIX,
  ABBY_FF_STORAGE_PREFIX,
  ABBY_RC_STORAGE_PREFIX,
} from "./constants";
import { RemoteConfigValue, RemoteConfigValueString } from "./schemas";

export function getABStorageKey(projectId: string, testName: string): string {
  return `${ABBY_AB_STORAGE_PREFIX}${projectId}_${testName}`;
}

export function getFFStorageKey(projectId: string, flagName: string): string {
  return `${ABBY_FF_STORAGE_PREFIX}${projectId}_${flagName}`;
}

export function getRCStorageKey(projectId: string, remoteConfigName: string): string {
  return `${ABBY_RC_STORAGE_PREFIX}${projectId}_${remoteConfigName}`;
}

export function assertUnreachable(x: never): never {
  throw new Error("Reached unreachable code");
}

export function remoteConfigStringToType({
  stringifiedValue,
  remoteConfigType,
}: {
  stringifiedValue: string;
  remoteConfigType: RemoteConfigValueString;
}): RemoteConfigValue {
  switch (remoteConfigType) {
    case "String":
      return stringifiedValue;
    case "Number":
      return parseInt(stringifiedValue, 10);
    case "JSON":
      return JSON.parse(stringifiedValue);
    default:
      assertUnreachable(remoteConfigType);
  }
}

export function getDefaultRemoteConfigValue(
  remoteConfigType: RemoteConfigValueString
): RemoteConfigValue {
  switch (remoteConfigType) {
    case "String":
      return "";
    case "Number":
      return 0;
    case "JSON":
      return {};
    default:
      assertUnreachable(remoteConfigType);
  }
}

export function stringifyRemoteConfigValue(value: RemoteConfigValue) {
  switch (typeof value) {
    case "number":
      return value.toString();
    case "string":
      return value;
    case "object":
      return JSON.stringify(value);
    default:
      assertUnreachable(value);
  }
}

export const getUseFeatureFlagRegex = (flagName: string) =>
  new RegExp(`useFeatureFlag\\s*\\(\\s*['"\`]${flagName}['"\`]\\s*\\)`);
