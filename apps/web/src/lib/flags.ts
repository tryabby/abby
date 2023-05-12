import { FeatureFlag } from "@prisma/client";
import { groupBy } from "lodash-es";

export function getFlagCount(flags: Array<FeatureFlag>) {
  return Object.keys(groupBy(flags, (f) => f.name)).length;
}
