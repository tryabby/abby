export type ABConfig<T extends string = string> = {
  variants: ReadonlyArray<T>;
};

export type Tests<TestName extends string = string> = Record<
  TestName,
  ABConfig
>;

export type ConfigData<FlagName extends string = string> = {
  projectId: string;
  tests: Tests;
  flags: FlagName[];
};

export enum Frameworks {
  Angular,
  NextJs,
  React,
  Svelte,
}

export type Framework = {
  framework: Frameworks;
  regex: RegExp;
  replaceRegex: RegExp;
};
