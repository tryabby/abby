export enum AbbyEventType {
  PING,
  ACT,
}

export type AbbyDataResponse = {
  tests: Array<{
    name: string;
    weights: number[];
  }>;
  flags: Array<{ name: string; isEnabled: boolean }>;
};
