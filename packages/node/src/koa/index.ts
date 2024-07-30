import type { Next, Context } from "koa";
import { ABConfig, Abby, AbbyConfig, RemoteConfigValueString } from "@tryabby/core";
import { createAbby } from "../index";

const instanceMap = new WeakMap<any, Abby<any, any, any, any, any>>();

export function createAbbyMiddleWare<
  const FlagName extends string,
  const TestName extends string,
  const Tests extends Record<TestName, ABConfig>,
  const RemoteConfig extends Record<RemoteConfigName, RemoteConfigValueString>,
  const RemoteConfigName extends Extract<keyof RemoteConfig, string>,
>(config: AbbyConfig<FlagName, Tests, string[], RemoteConfigName, RemoteConfig>) {
  let abbyInstance = instanceMap.get(config);

  if (!abbyInstance) {
    abbyInstance = createAbby(config);
    instanceMap.set(config, abbyInstance);
  }

  const middleware = async (ctx: Context, next: Next) => {
    if (!abbyInstance) {
      throw new Error("Abby is undefined");
    }
    await abbyInstance.loadProjectData();
    if (ctx.headers.cookie) {
      abbyInstance.setLocalOverrides(ctx.headers.cookie);
    }

    next();
  };

  return {
    middleware,
    abby: abbyInstance as Abby<FlagName, TestName, Tests, RemoteConfig, RemoteConfigName, any>,
  };
}
