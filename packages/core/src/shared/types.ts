import type { ABConfig, RemoteConfigValue } from "..";

export enum AbbyEventType {
  PING = 0,
  ACT = 1,
}

export type AbbyDataResponse = {
  tests: Array<{
    name: string;
    weights: number[];
  }>;
  flags: Array<{
    name: string;
    value: boolean;
  }>;
  remoteConfig: Array<{ name: string; value: RemoteConfigValue }>;
};

export type LegacyAbbyDataResponse = {
  tests: Array<{
    name: string;
    weights: number[];
  }>;
  flags: Array<{ name: string; isEnabled: boolean }>;
};

export type ExtractVariants<
  TestName extends string,
  Tests extends Record<TestName, ABConfig>,
> = Tests[TestName]["variants"][number];
