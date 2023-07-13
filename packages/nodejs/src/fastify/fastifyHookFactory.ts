import { ABConfig, FlagValueString, AbbyConfig } from "@tryabby/core";
import { F } from "ts-toolbelt";
import { createAbby } from "../abby/createAbby";
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
   * hook to disable a path via feature flag
   */
  const featureFlagHook = <F extends keyof Flags>(
    key: F,
    request: FastifyRequest,
    reply: FastifyReply,
    done: HookHandlerDoneFunction
  ) => {
    const flagValue = abbyNodeInstance.getFeatureFlagValue(key as unknown as FlagName); //TODO fix type
    if (flagValue) {
      reply.status(403);
      reply.send();
      return;
    }
    done();
  };

  /**
   * helper function to extract a single test
   * @param name
   * @returns
   */

  const extractTest = <T extends keyof Tests>(name: T): any => {
    const variant = abbyNodeInstance.getABTestValue(name);
    return { name, variant };
  };

  /**
   * hook to parse all ab values on the request object needs to be used at the top
   */
  const ABTestHook = <T extends keyof Tests>(
    request: FastifyRequest,
    reply: FastifyReply,
    done: HookHandlerDoneFunction
  ) => {
    if (configNarrowed.tests) {
      const allTests = Object.keys(configNarrowed.tests) as T[];
      const vals = allTests.map((test) => {
        return extractTest(test);
      });
    }
    done();
  };

  const getFlagValue = <F extends keyof Flags>(key: F) => {
    return abbyNodeInstance.getFeatureFlagValue(key as unknown as FlagName);
  };

  const getTestValue = <T extends keyof Tests>(key: T, req: FastifyRequest) => {
    return abbyNodeInstance.getABTestValue(key, req);
  };

  return { ABTestHook, featureFlagHook, getFlagValue, getTestValue };
};
