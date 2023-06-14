import { NextFunction, Request, Response } from "express";
import { setRequest } from "../abby/contexts/requestContext.ts";
import { setResponse } from "../abby/contexts/responseContext.ts";
import { AbbyConfig, ABConfig } from "@tryabby/core";
import { createAbby } from "../abby/createAbby.ts";
import { F } from "ts-toolbelt";

type abbyMiddlewareConfig = {};

export const abbyMiddlewareFactory = async <
  FlagName extends string,
  TestName extends string,
  Tests extends Record<TestName, ABConfig>,
  ConfigType extends AbbyConfig<FlagName, Tests> = AbbyConfig<FlagName, Tests>
>({
  abbyConfig,
  config: abbyMiddlewarreConfig,
}: {
  abbyConfig: F.Narrow<AbbyConfig<FlagName, Tests>>;
  config?: abbyMiddlewareConfig;
}) => {
  const config = abbyConfig as unknown as ConfigType;
  const abby = await createAbby(abbyConfig);

  const featureFlagMiddleware = <F extends NonNullable<ConfigType["flags"]>[number]>(
    name: F,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const flagValue = abby.getFeatureFlagValue(name);
    if (!flagValue) {
      res.sendStatus(403);
      console.log("return");
      return;
    }
    next();
  };

  const AbTestMiddleware = <T extends keyof Tests>(
    name: T,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    setRequest(req);
    setResponse(res);
    const value = abby.getABTestValue(name);
    next();
  };

  return { featureFlagMiddleware, AbTestMiddleware };
};
