import { ABConfig, FlagValueString, AbbyConfig } from "@tryabby/core";
import { F } from "ts-toolbelt";
import { createAbby } from "../abby/createAbby";
import { abby } from "./createAbby";
import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from "fastify";

export const abbyFastifyFactory = <
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
  /**
   * hook to disbale a path via feature flag
   */
  const featureFlagHook = <F extends keyof Flags>(
    key: F,
    request: FastifyRequest,
    reply: FastifyReply,
    done: HookHandlerDoneFunction
  ) => {
    const flagValue = abbyNodeInstance.getFeatureFlagValue(key as unknown as FlagName); //TODO fix type
    if (!flagValue) {
      reply.status(403).send();
      console.log("disbaled endpoint");
      return;
    }
    done();
  };
  /**
   * hook to parse all ab values on the request object needs to be used at the top
   */
  const ABTestHook = <T extends keyof Tests>(
    key: T,
    request: FastifyRequest,
    reply: FastifyReply,
    done: HookHandlerDoneFunction
  ) => {};

  const getFlagValue = <F extends keyof Flags>(key: F) => {
    return abbyNodeInstance.getFeatureFlagValue(key as unknown as FlagName);
  };

  const getTestValue = <T extends keyof Tests>(key: T) => {
    return abbyNodeInstance.getABTestValue(key);
  };

  return { ABTestHook, featureFlagHook, getFlagValue, getTestValue };
};
