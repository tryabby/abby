import {
  AbbyConfig,
  ABConfig,
  createAbby as baseCreateAbby,
  withDevtoolsFunction,
  ABTestReturnValue,
} from "@tryabby/react";
import { AbbyDataResponse, getABStorageKey, RemoteConfigValueString } from "@tryabby/core";
import type { F } from "ts-toolbelt";
import { ABBY_DATA_KEY, withAbby } from "./withAbby";
import { HttpService } from "@tryabby/core";
import type { NextMiddleware, NextRequest, NextResponse } from "next/server";
import Cookie from "js-cookie";
import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { getIsomorphicCookies, isBrowser, isEdgeFunction } from "./helpers";

export { defineConfig } from "@tryabby/core";

// TODO: figure out how to prevent re-typing of the same types
export function createAbby<
  FlagName extends string,
  TestName extends string,
  Tests extends Record<TestName, ABConfig>,
  RemoteConfig extends Record<RemoteConfigName, RemoteConfigValueString>,
  RemoteConfigName extends Extract<keyof RemoteConfig, string>,
  ConfigType extends AbbyConfig<
    FlagName,
    Tests,
    string[],
    RemoteConfigName,
    RemoteConfig
  > = AbbyConfig<FlagName, Tests, string[], RemoteConfigName, RemoteConfig>,
>(config: F.Narrow<AbbyConfig<FlagName, Tests, string[], RemoteConfigName, RemoteConfig>>) {
  const {
    AbbyProvider,
    useAbby,
    useFeatureFlag,
    getFeatureFlagValue,
    useRemoteConfig,
    getRemoteConfig,
    __abby__,
    getVariants,
    withDevtools,
    useFeatureFlags,
    useRemoteConfigVariables,
  } = baseCreateAbby<FlagName, TestName, Tests, RemoteConfig, RemoteConfigName, ConfigType>(config);

  const abbyApiHandler =
    <HandlerType extends NextApiHandler | NextMiddleware>(handler: HandlerType) =>
    async (...args: Parameters<HandlerType>) => {
      const data = await HttpService.getProjectData({
        projectId: config.projectId,
        environment: config.currentEnvironment,
        url: config.apiUrl,
      });
      if (data) {
        __abby__.init(data);
      }
      return (handler as any)(...args) as ReturnType<HandlerType>;
    };

  return {
    AbbyProvider,
    // we need to retype the useAbby function here
    // because re-using the types from the react package causes the ts-toolbelt package to behave weirdly
    // and therefore not working as expected
    useAbby: useAbby as <
      K extends keyof Tests,
      TestVariant extends Tests[K]["variants"][number],
      LookupValue,
      Lookup extends Record<TestVariant, LookupValue> | undefined = undefined,
    >(
      name: K,
      lookupObject?: F.Narrow<Lookup>
    ) => {
      variant: ABTestReturnValue<Lookup, TestVariant>;
      onAct: () => void;
    },
    useFeatureFlag,
    withAbby: withAbby(config as AbbyConfig<FlagName, Tests>, __abby__),
    getFeatureFlagValue,
    useRemoteConfig,
    useFeatureFlags,
    useRemoteConfigVariables,
    getRemoteConfig,
    __abby__,
    getVariants,
    withDevtools: withDevtools as withDevtoolsFunction,
    withAbbyEdge: abbyApiHandler<NextMiddleware>,
    withAbbyApiHandler: abbyApiHandler<NextApiHandler>,
    /**
     * Isomorphic function to get the value of an A/B test
     * if the value is not set yet it will set it and return the new value
     * otherwise it will return the stored value
     * @param name the name of the test
     * @param req the NextRequest, must be passed on the server and omitted on the client
     * @returns the value of the test and a function to set the cookie
     */
    getABTestValue<
      T extends keyof Tests,
      TestVariant extends Tests[T]["variants"][number],
      LookupValue,
      Lookup extends Record<TestVariant, LookupValue> | undefined = undefined,
      RequestType extends NextRequest | NextApiRequest | undefined = undefined,
      ResponseType extends NextResponse | NextApiResponse = RequestType extends NextRequest
        ? NextResponse
        : RequestType extends NextApiRequest
          ? NextApiResponse
          : never,
    >(
      name: T,
      req?: RequestType,
      lookupObject?: F.Narrow<Lookup>
    ): [
      Lookup extends undefined
        ? TestVariant
        : TestVariant extends keyof Lookup
          ? Lookup[TestVariant]
          : never,
      RequestType extends NextRequest | NextApiRequest ? (res: ResponseType) => void : () => void,
    ] {
      const cookies = getIsomorphicCookies(req);

      const storedValue = cookies.get(getABStorageKey(config.projectId, name as string));

      const cookieKey = getABStorageKey(config.projectId, name as string);

      if (storedValue) {
        const storedVariant = typeof storedValue === "string" ? storedValue : storedValue.value;

        return [
          lookupObject ? lookupObject[storedVariant as keyof typeof lookupObject] : storedVariant,
          () => {},
        ];
      }

      const newValue = __abby__.getTestVariant(name);

      const setCookieFunc = (res?: ResponseType) => {
        if (!res && typeof window === "undefined")
          throw new Error("You must pass a response object to setABTestValue on the server");

        if (isBrowser(res)) {
          Cookie.set(cookieKey, newValue, {
            httpOnly: false,
          });
          return;
        }

        if (isEdgeFunction(res)) {
          res.cookies.set(cookieKey, newValue, {
            httpOnly: false,
          });
          return;
        }

        res.setHeader("Set-Cookie", `${cookieKey}=${newValue};`);
      };

      return [
        lookupObject ? (lookupObject[newValue as keyof typeof lookupObject] as any) : newValue,
        setCookieFunc,
      ];
    },
    /**
     * Isomorphic function to reset the value of an A/B test
     * if called on the server (edge function or API route) you will need to pass in the request object
     * @param name the name of the test
     * @param req the NextRequest, must be passed on the server and omitted on the client
     */
    getABResetFunction: <
      T extends keyof Tests,
      RequestType extends NextRequest | NextApiRequest | undefined = undefined,
      ResponseType extends NextResponse | NextApiResponse = RequestType extends NextRequest
        ? NextResponse
        : RequestType extends NextApiRequest
          ? NextApiResponse
          : never,
    >(
      name: T,
      req?: RequestType
    ): RequestType extends NextRequest | NextApiRequest
      ? (res: ResponseType) => void
      : () => void => {
      const cookies = getIsomorphicCookies(req);

      const cookieKey = getABStorageKey(config.projectId, name as string);

      return (res?: ResponseType) => {
        if (!res && typeof window === "undefined")
          throw new Error("You must pass a response object to setABTestValue on the server");

        if (isBrowser(res)) {
          cookies.delete(cookieKey);
          return;
        }

        if (isEdgeFunction(res)) {
          res.cookies.delete(cookieKey);
          return;
        }
        res.setHeader("Set-Cookie", `${cookieKey}=d; Max-Age=0`);
      };
    },
    // TODO: make leaner preloads
    // preloadData: async ({
    //   flags,
    //   tests,
    // }: {
    //   flags?: FlagName[];
    //   tests?: O.NonNullableKeys<Tests>[];
    // }) => {
    //   const data = await HttpService.getProjectData({
    //     projectId: config.projectId,
    //     environment: config.currentEnvironment,
    //     url: config.apiUrl,
    //   });
    //   if (!data) return {};
    //   __abby__.init(data);
    //   return {
    //     [ABBY_DATA_KEY]: data,
    //   };
    // },
  };
}

export { ABBY_DATA_KEY };

export type WithAbbyProps = {
  [key in typeof ABBY_DATA_KEY]: AbbyDataResponse;
} & {
  [key: string]: any;
};
