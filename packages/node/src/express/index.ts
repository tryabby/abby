import type { NextFunction, Request, Response } from "express";
import { ABConfig, Abby, AbbyConfig, RemoteConfigValueString } from "@tryabby/core";
import { createAbby } from "../index";

const instanceMap = new Map<string, Abby<any, any, any, any, any>>();
const initializedProjects = new Set<string>();

export function createAbbyMiddleWare<
  const FlagName extends string,
  const TestName extends string,
  const Tests extends Record<TestName, ABConfig>,
  const RemoteConfig extends Record<RemoteConfigName, RemoteConfigValueString>,
  const RemoteConfigName extends Extract<keyof RemoteConfig, string>,
>(config: AbbyConfig<FlagName, Tests, string[], RemoteConfigName, RemoteConfig>) {
  let abbyInstance = instanceMap.get(config.projectId);

  if (!abbyInstance) {
    abbyInstance = createAbby(config);
    instanceMap.set(config.projectId, abbyInstance);
  }

  const middleware = async (req: Request, _res: Response, next: NextFunction) => {
    if (!abbyInstance) {
      throw new Error("Abby is undefined");
    }
    await abbyInstance.loadProjectData();
    if (req.headers.cookie) {
      abbyInstance.setLocalOverrides(req.headers.cookie);
    }
    initializedProjects.add(config.projectId);
    next();
  };

  return {
    middleware,
    abby: abbyInstance as Abby<FlagName, TestName, Tests, RemoteConfig, RemoteConfigName, any>,
  };
}
