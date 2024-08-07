import { FeatureFlagType } from "@prisma/client";

export function validateFlag(flagType: FeatureFlagType, value: string) {
  switch (flagType) {
    case FeatureFlagType.BOOLEAN: {
      return value === "true" || value === "false";
    }
    case FeatureFlagType.NUMBER: {
      return !Number.isNaN(Number(value));
    }
    case FeatureFlagType.STRING: {
      return true;
    }
    case FeatureFlagType.JSON: {
      try {
        JSON.parse(value);
        return true;
      } catch (_e) {
        return false;
      }
    }
  }
  // exhaustivenes test for switch
  flagType satisfies never;
}
