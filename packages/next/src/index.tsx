import {
  AbbyConfig,
  ABConfig,
  createAbby as baseCreateAbby,
  withDevtoolsFunction,
} from "@tryabby/react";
import { AbbyDataResponse, FlagValueString, getABStorageKey } from "@tryabby/core";
import type { F } from "ts-toolbelt";
import { ABBY_DATA_KEY, withAbby } from "./withAbby";
import { HttpService } from "@tryabby/core";
import type { NextMiddleware, NextRequest, NextResponse } from "next/server";
import Cookie from "js-cookie";
import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { getIsomorphicCookies, isBrowser, isEdgeFunction } from "./helpers";

// TODO: figure out how to prevent re-typing of the same types
export function createAbby<
  FlagName extends string,
  TestName extends string,
  Tests extends Record<TestName, ABConfig>,
  Flags extends Record<FlagName, FlagValueString> = Record<FlagName, FlagValueString>
>(config: F.Narrow<AbbyConfig<FlagName, Tests, Flags>>) {
  const {
    AbbyProvider,
    useAbby,
    useFeatureFlag,
    getFeatureFlagValue,
    __abby__,
    getVariants,
    withDevtools,
  } = baseCreateAbby<FlagName, TestName, Tests, Flags>(config);

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
    useAbby,
    useFeatureFlag,
    withAbby: withAbby(config as AbbyConfig<FlagName, Tests>, __abby__),
    getFeatureFlagValue,
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
      RequestType extends NextRequest | NextApiRequest | undefined = undefined,
      ResponseType extends NextResponse | NextApiResponse = RequestType extends NextRequest
        ? NextResponse
        : RequestType extends NextApiRequest
        ? NextApiResponse
        : never
    >(
      name: T,
      req?: RequestType
    ): [
      Tests[T]["variants"][number],
      RequestType extends NextRequest | NextApiRequest ? (res: ResponseType) => void : () => void
    ] {
      const cookies = getIsomorphicCookies(req);

      const storedValue = cookies.get(getABStorageKey(config.projectId, name as string));

      const cookieKey = getABStorageKey(config.projectId, name as string);

      if (storedValue) {
        return [typeof storedValue === "string" ? storedValue : storedValue.value, () => {}];
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

      return [newValue, setCookieFunc];
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
        : never
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
