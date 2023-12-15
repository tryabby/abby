import type { NextFunction, Request, Response } from "express";
import { ABConfig, Abby, AbbyConfig, RemoteConfigValueString } from "@tryabby/core";
import { F } from "ts-toolbelt";
import { InMemoryStorageService } from "../utils/MemoryStorage";

const instanceMap = new WeakMap<any, Abby<any, any, any, any, any>>();

export function createAbbyMiddleWare<
  FlagName extends string,
  TestName extends string,
  Tests extends Record<TestName, ABConfig>,
  RemoteConfig extends Record<RemoteConfigName, RemoteConfigValueString>,
  RemoteConfigName extends Extract<keyof RemoteConfig, string>,
>(config: F.Narrow<AbbyConfig<FlagName, Tests, string[], RemoteConfigName, RemoteConfig>>) {
  let abbyInstance = instanceMap.get(config);

  if (!abbyInstance) {
    const testStorage = new InMemoryStorageService();
    abbyInstance = new Abby(config, testStorage);
    instanceMap.set(config, abbyInstance);
  }

  const middleware = async (req: Request, _res: Response, next: NextFunction) => {
    if (!abbyInstance) {
      throw new Error("Abby is undefined");
    }
    await abbyInstance.loadProjectData();
    if (req.headers.cookie) {
      abbyInstance.setLocalOverrides(req.headers.cookie);
    }

    next();
  };

  return {
    middleware,
    abby: abbyInstance as Abby<FlagName, TestName, Tests, RemoteConfig, RemoteConfigName, any>,
  };
}
