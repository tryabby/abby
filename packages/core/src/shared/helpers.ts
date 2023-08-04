import { ABBY_AB_STORAGE_PREFIX, ABBY_FF_STORAGE_PREFIX } from "./constants";
import { FlagValue, FlagValueString } from "./schemas";

export function getABStorageKey(projectId: string, testName: string): string {
  return `${ABBY_AB_STORAGE_PREFIX}${projectId}_${testName}`;
}

export function getFFStorageKey(projectId: string, flagName: string): string {
  return `${ABBY_FF_STORAGE_PREFIX}${projectId}_${flagName}`;
}

export function assertUnreachable(x: never): never {
  throw new Error("Reached unreachable code");
}

export function flagStringToType({
  stringifiedValue,
  flagType,
}: {
  stringifiedValue: string;
  flagType: FlagValueString;
}): FlagValue {
  switch (flagType) {
    case "Boolean":
      return stringifiedValue === "true";
    case "String":
      return stringifiedValue;
    case "Number":
      return parseInt(stringifiedValue, 10);
    case "JSON":
      return JSON.parse(stringifiedValue);
    default:
      assertUnreachable(flagType);
  }
}

export function getDefaultFlagValue(flagType: FlagValueString): FlagValue {
  switch (flagType) {
    case "Boolean":
      return false;
    case "String":
      return "";
    case "Number":
      return 0;
    case "JSON":
      return {};
    default:
      assertUnreachable(flagType);
  }
}

export function stringifyFlagValue(value: FlagValue) {
  switch (typeof value) {
    case "boolean":
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
