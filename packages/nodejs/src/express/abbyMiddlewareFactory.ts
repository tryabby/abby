import { NextFunction, Request, Response } from "express";
import { setRequest } from "../abby/contexts/requestContext.ts";
import { setResponse } from "../abby/contexts/responseContext.ts";
import { AbbyConfig, ABConfig } from "@tryabby/core";
import { createAbby } from "../abby/createAbby.ts";
import { F } from "ts-toolbelt";

export const abbyMiddlewareFactory = async <
  FlagName extends string,
  TestName extends string,
  Tests extends Record<TestName, ABConfig>,
  ConfigType extends AbbyConfig<FlagName, Tests> = AbbyConfig<FlagName, Tests>
>({
  abbyConfig,
}: {
  abbyConfig: F.Narrow<AbbyConfig<FlagName, Tests>>;
}) => {
  const configNarrowed = abbyConfig as unknown as ConfigType;
  const abby = await createAbby(abbyConfig);

  const featureFlagMiddleware = <F extends NonNullable<ConfigType["flags"]>[number]>(
    name: F,
    req: Request,
    res: Response,
    next: NextFunction,
    statusCode?: number,
    errorMessage?: string
  ) => {
    const flagValue = abby.getFeatureFlagValue(name);

    if (!flagValue) {
      res.status(statusCode ?? 403).json(errorMessage);
      return;
    }
    next();
  };

  const setRequestResponse = (req: Request, res: Response) => {
    setRequest(req);
    setResponse(res);
  };

  const extractTest = <T extends keyof Tests>(name: T) => {
    const variant = abby.getABTestValue(name);
    return { name, variant };
  };

  const allTestsMiddleWare = <T extends keyof Tests>(
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (configNarrowed.tests) {
      setRequestResponse(req, res);
      const allTests = Object.keys(configNarrowed.tests) as T[]; //TODO get type in a proper way
      const testWithVariant = allTests.map((test) => {
        return extractTest(test);
      });
    }

    next();
  };

  const allFlagMiddleWare = <F extends NonNullable<ConfigType["flags"]>[number]>(
    req: Request,
    res: Response,
    next: NextFunction
  ) => {};

  const getVariant = <T extends keyof Tests>(name: T) => {
    return abby.getABTestValue(name);
  };

  return { featureFlagMiddleware, allTestsMiddleWare, getVariant };
};
