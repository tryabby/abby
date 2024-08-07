import {
  AbbyConfig,
  ABConfig,
  createAbby as baseCreateAbby,
  withDevtoolsFunction,
  ABTestReturnValue,
} from "@tryabby/react";
import { AbbyDataResponse, HttpService, RemoteConfigValueString } from "@tryabby/core";
import { useMatches } from "@remix-run/react";

const ABBY_DATA_KEY = "__ABBY_PROJECT_DATA__";

const loaderCache = new PromiseCache<AbbyDataResponse | null>();

import { PropsWithChildren } from "react";
import { PromiseCache } from "./cache";

export { defineConfig } from "@tryabby/core";

export function createAbby<
  const FlagName extends string,
  const TestName extends string,
  const Tests extends Record<TestName, ABConfig>,
  const RemoteConfig extends Record<RemoteConfigName, RemoteConfigValueString>,
  const RemoteConfigName extends Extract<keyof RemoteConfig, string>,
>(config: AbbyConfig<FlagName, Tests, string[], RemoteConfigName, RemoteConfig>) {
  const {
    AbbyProvider,
    useAbby,
    useFeatureFlag,
    getFeatureFlagValue,
    useRemoteConfig,
    getRemoteConfig,
    getABTestValue,
    __abby__,
    getVariants,
    withDevtools,
    useFeatureFlags,
    useRemoteConfigVariables,
  } = baseCreateAbby<FlagName, TestName, Tests, RemoteConfig, RemoteConfigName>(config);

  const AbbyRemixProvider = ({ children }: PropsWithChildren) => {
    const matches = useMatches();

    let initialData: undefined | AbbyDataResponse = undefined;

    matches.forEach((match) => {
      if (
        match.data &&
        typeof match.data === "object" &&
        ABBY_DATA_KEY in match.data &&
        match.data[ABBY_DATA_KEY] != null
      ) {
        initialData = match.data[ABBY_DATA_KEY] as AbbyDataResponse;
      }
    });

    return <AbbyProvider initialData={initialData}>{children}</AbbyProvider>;
  };

  /**
   * Helper function to get Abby data from the server
   * @param ctx - Remix context
   * @returns - Abby data
   */
  const getAbbyData = async <C extends { request: Request }>(ctx: C) => {
    const cookies = ctx.request.headers.get("Cookie");

    const data = await loaderCache.get(
      [
        config.projectId,
        config.currentEnvironment,
        config.__experimentalCdnUrl,
        config.apiUrl,
      ].join("-"),
      () =>
        HttpService.getProjectData({
          projectId: config.projectId,
          environment: config.currentEnvironment,
          __experimentalCdnUrl: config.__experimentalCdnUrl,
          url: config.apiUrl,
        })
    );

    if (data) {
      __abby__.init(data);
    }
    if (cookies) {
      __abby__.setLocalOverrides(cookies);
    }

    return {
      [ABBY_DATA_KEY]: data,
    };
  };

  return {
    AbbyProvider: AbbyRemixProvider,
    useAbby,
    useFeatureFlag,
    getFeatureFlagValue,
    useRemoteConfig,
    useFeatureFlags,
    useRemoteConfigVariables,
    getRemoteConfig,
    __abby__,
    getVariants,
    withDevtools: withDevtools as withDevtoolsFunction,
    getAbbyData,
    getABTestValue,
  };
}
