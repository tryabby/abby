/* eslint-disable turbo/no-undeclared-env-vars */
import { createAbby } from "@tryabby/next";
import abbyDevtools from "@tryabby/devtools";
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
} = createAbby(abbyConfig);

export const AbbyDevtools = withDevtools(abbyDevtools, {});
