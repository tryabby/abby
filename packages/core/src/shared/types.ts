import { Key } from "ts-toolbelt/out/Any/Key";
import { ABConfig } from "..";
import { FlagValue } from "./schemas";

export enum AbbyEventType {
  PING,
  ACT,
}

export type AbbyDataResponse = {
  tests: Array<{
    name: string;
    weights: number[];
  }>;
  flags: Array<{
    name: string;
    value: FlagValue;
  }>;
};

export type LegacyAbbyDataResponse = {
  tests: Array<{
    name: string;
    weights: number[];
  }>;
  flags: Array<{ name: string; isEnabled: boolean }>;
};

export type ExtractVariants<
  TestName extends Key,
  Tests extends Record<TestName, ABConfig>,
> = Tests[TestName]["variants"][number];

