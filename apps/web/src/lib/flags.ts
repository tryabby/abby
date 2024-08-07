import { type FeatureFlag, FeatureFlagType } from "@prisma/client";
import {
  DEFAULT_FEATURE_FLAG_VALUE,
  type RemoteConfigValue,
  type RemoteConfigValueString,
  assertUnreachable,
  getDefaultRemoteConfigValue,
  stringifyRemoteConfigValue,
} from "@tryabby/core";
import { groupBy } from "lodash-es";
import type { FlagValueString } from "../types/flags";

export function getFlagCount(flags: Array<FeatureFlag>) {
  return Object.keys(groupBy(flags, (f) => f.name)).length;
}

/**
 * Helper function to transform a string value of a flag to the correct type
 */
export function transformFlagValue(value: string, type: FeatureFlagType) {
  switch (type) {
    case FeatureFlagType.BOOLEAN:
      return value === "true";
    case FeatureFlagType.NUMBER:
      return Number.parseInt(value);
    case FeatureFlagType.JSON:
      return JSON.parse(value);
    case FeatureFlagType.STRING:
      return value;
    default:
      assertUnreachable(type);
  }
}

export function stringifyFlagValue(value: RemoteConfigValue | boolean): string {
  if (typeof value === "boolean") {
    return value.toString();
  }

  return stringifyRemoteConfigValue(value);
}

export function getDefaultFlagValue(type: RemoteConfigValueString | "Boolean") {
  switch (type) {
    case "JSON":
    case "String":
    case "Number":
      return getDefaultRemoteConfigValue(type);
    case "Boolean":
      return DEFAULT_FEATURE_FLAG_VALUE;
  }
}

export function getFlagTypeClassName(type: FeatureFlagType) {
  switch (type) {
    case FeatureFlagType.BOOLEAN:
      return "text-orange-400 border-orange-400";
    case FeatureFlagType.NUMBER:
      return "text-blue-400 border-blue-400";
    case FeatureFlagType.STRING:
      return "text-green-400 border-green-400";
    case FeatureFlagType.JSON:
      return "text-purple-400 border-purple-400";
    default: {
      assertUnreachable(type);
    }
  }
}

export function transformDBFlagTypeToclient(
  type: FeatureFlagType
): FlagValueString {
  switch (type) {
    case FeatureFlagType.BOOLEAN:
      return "Boolean";
    case FeatureFlagType.NUMBER:
      return "Number";
    case FeatureFlagType.STRING:
      return "String";
    case FeatureFlagType.JSON:
      return "JSON";
    default:
      assertUnreachable(type);
  }
}

export function transformClientFlagToDBType(
  type: FlagValueString
): FeatureFlagType {
  switch (type) {
    case "Boolean":
      return FeatureFlagType.BOOLEAN;
    case "Number":
      return FeatureFlagType.NUMBER;
    case "String":
      return FeatureFlagType.STRING;
    case "JSON":
      return FeatureFlagType.JSON;
    default:
      assertUnreachable(type);
  }
}
