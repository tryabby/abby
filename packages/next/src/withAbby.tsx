import { HttpService } from "@tryabby/core";
import type { Abby } from "@tryabby/core";
import type { AbbyDataResponse } from "@tryabby/core";
import type { AbbyConfig } from "@tryabby/react";
import type {
  AppContextType,
  AppPropsType,
  NextComponentType,
} from "next/dist/shared/lib/utils";
import type { NextRouter } from "next/router";
import { PromiseCache } from "./cache";

export const ABBY_DATA_KEY = "__ABBY_PROJECT_DATA__";

export function withAbby<
  Config extends Pick<
    AbbyConfig,
    "apiUrl" | "projectId" | "currentEnvironment"
  >,
>(
  { apiUrl, projectId, currentEnvironment }: Config,
  abbyInstance: Abby<any, any, any, any, any>,
  preloadAll = true
) {
  const promiseCache = new PromiseCache<AbbyDataResponse | null>();

  return (AppOrPage: NextComponentType<any, any, any>): NextComponentType => {
    const WithAbby = (props: AppPropsType<NextRouter, any>) => {
      return <AppOrPage {...props} />;
    };

    WithAbby.getInitialProps = async (appOrPageCtx: AppContextType) => {
      // Determine if we are wrapping an App component or a Page component.
      const isApp = !!appOrPageCtx.Component;

      let pageProps: Record<string, any> = {};

      if (preloadAll && isApp) {
        const abbyData = await promiseCache.get("abbyData", () =>
          HttpService.getProjectData({
            projectId,
            environment: currentEnvironment,
            url: apiUrl,
          })
        );

        if (abbyData) {
          abbyInstance.init(abbyData);
        }

        pageProps[ABBY_DATA_KEY] = abbyData;
      }

      abbyInstance.setLocalOverrides(
        appOrPageCtx.ctx.req?.headers.cookie ?? ""
      );

      // Run the wrapped component's getInitialProps function.
      if (AppOrPage.getInitialProps) {
        const originalProps = await AppOrPage.getInitialProps(
          appOrPageCtx as any
        );
        const originalPageProps = isApp
          ? originalProps.pageProps ?? {}
          : originalProps;

        pageProps = {
          ...originalPageProps,
          ...pageProps,
        };
      }

      const getAppTreeProps = (props: Record<string, unknown>) =>
        isApp ? { pageProps: props } : props;

      return getAppTreeProps(pageProps);
    };

    const displayName = AppOrPage.displayName || AppOrPage.name || "Component";
    WithAbby.displayName = `withAbby(${displayName})`;

    return WithAbby as any;
  };
}
