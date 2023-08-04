import { FeatureFlag, FeatureFlagType } from "@prisma/client";
import { assertUnreachable } from "@tryabby/core";
import { FlagValueString } from "@tryabby/core";
import { groupBy } from "lodash-es";

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
      return parseInt(value);
    case FeatureFlagType.JSON:
      return JSON.parse(value);
    case FeatureFlagType.STRING:
      return value;
    default:
      assertUnreachable(type);
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
