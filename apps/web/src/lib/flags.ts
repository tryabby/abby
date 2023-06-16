import { FeatureFlag, FeatureFlagType } from "@prisma/client";
import { groupBy } from "lodash-es";

export function getFlagCount(flags: Array<FeatureFlag>) {
  return Object.keys(groupBy(flags, (f) => f.name)).length;
}

export function transformFlagValue(value: string, type: FeatureFlagType) {
  switch (type) {
    case FeatureFlagType.BOOLEAN:
      return value === "true";
    case FeatureFlagType.NUMBER:
      return parseInt(value);
    default:
      return value;
  }
}
