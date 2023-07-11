import { NextFunction, Request, Response } from "express";
import { setRequest } from "../abby/contexts/requestContext";
import { setResponse } from "../abby/contexts/responseContext";
import { AbbyConfig, ABConfig, FlagValueString } from "@tryabby/core";
import { createAbby } from "../abby/createAbby";
import { F } from "ts-toolbelt";

interface AbbyMiddlewareFactoryResult {
  featureFlagMiddleware: <F extends string>(
    name: F,
    req: Request,
    res: Response,
    next: NextFunction,
    deciderFunction: (req: Request, flagValue: any) => boolean
  ) => void;
  allTestsMiddleWare: <T extends string>(req: Request, res: Response, next: NextFunction) => void;
  getVariant: <T extends string>(name: T) => any;
}

export const abbyMiddlewareFactory = <
  FlagName extends string,
  TestName extends string,
  Tests extends Record<TestName, ABConfig>,
  Flags extends Record<FlagName, FlagValueString> = Record<FlagName, FlagValueString>,
  ConfigType extends AbbyConfig<FlagName, Tests> = AbbyConfig<FlagName, Tests>,
>({
  abbyConfig,
}: {
  abbyConfig: F.Narrow<AbbyConfig<FlagName, Tests>>;
}) => {
  const abbyNodeInstance = createAbby(abbyConfig);
  const configNarrowed = abbyConfig as unknown as ConfigType;

  const featureFlagMiddleware = <F extends keyof Flags>(
    name: F,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const flagValue = abbyNodeInstance.getFeatureFlagValue(name as unknown as FlagName); //TODO fix type

    const decision = flagValue;
    if (!decision) {
      res.status(403).json("errorMessage");
      return;
    }
    next();
  };

  const setRequestResponse = (req: Request, res: Response): void => {
    setRequest(req);
    setResponse(res);
  };

  const extractTest = <T extends keyof Tests>(name: T): any => {
    const variant = abbyNodeInstance.getABTestValue(name);
    console.log(name, variant);
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

  // const allFlagMiddleWare = <F extends keyof Flags>(
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  // ) => {};

  const getVariant = <T extends keyof Tests>(name: T) => {
    return abbyNodeInstance.getABTestValue(name);
  };

  return { featureFlagMiddleware, allTestsMiddleWare, getVariant };
};
