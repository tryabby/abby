import abbyDevtools from "@tryabby/devtools";
import { createAbby } from "@tryabby/next";
import abbyConfig from "../../abby.config";

export const {
  useAbby,
  AbbyProvider,
  useFeatureFlag,
  withAbby,
  getFeatureFlagValue,
  withDevtools,
  withAbbyEdge,
  getABTestValue,
  withAbbyApiHandler,
  getABResetFunction,
  updateUserProperties,
} = createAbby(abbyConfig);

export const AbbyDevtools = withDevtools(abbyDevtools, {});
