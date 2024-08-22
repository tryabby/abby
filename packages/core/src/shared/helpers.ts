import {
  ABBY_AB_STORAGE_PREFIX,
  ABBY_FF_STORAGE_PREFIX,
  ABBY_RC_STORAGE_PREFIX,
} from "./constants";
import type { RemoteConfigValue, RemoteConfigValueString } from "./schemas";
import type { AbbyData, AbbyDataResponse } from "./types";

export function getABStorageKey(projectId: string, testName: string): string {
  return `${ABBY_AB_STORAGE_PREFIX}${projectId}_${testName}`;
}

export function getFFStorageKey(projectId: string, flagName: string): string {
  return `${ABBY_FF_STORAGE_PREFIX}${projectId}_${flagName}`;
}

export function getRCStorageKey(
  projectId: string,
  remoteConfigName: string
): string {
  return `${ABBY_RC_STORAGE_PREFIX}${projectId}_${remoteConfigName}`;
}

export function assertUnreachable(_x: never): never {
  throw new Error("Reached unreachable code");
}

export function remoteConfigStringToType({
  stringifiedValue,
  remoteConfigType,
}: {
  stringifiedValue: string;
  remoteConfigType: RemoteConfigValueString;
}): RemoteConfigValue {
  switch (remoteConfigType) {
    case "String":
      return stringifiedValue;
    case "Number":
      return Number.parseInt(stringifiedValue, 10);
    case "JSON":
      return JSON.parse(stringifiedValue);
    default:
      assertUnreachable(remoteConfigType);
  }
}

export function getDefaultRemoteConfigValue(
  remoteConfigType: RemoteConfigValueString
): RemoteConfigValue {
  switch (remoteConfigType) {
    case "String":
      return "";
    case "Number":
      return 0;
    case "JSON":
      return {};
    default:
      assertUnreachable(remoteConfigType);
  }
}

export function stringifyRemoteConfigValue(value: RemoteConfigValue) {
  switch (typeof value) {
    case "number":
      return value.toString();
    case "string":
      return value;
    case "object":
      return JSON.stringify(value);
    default:
      assertUnreachable(value);
  }
}

export const getUseFeatureFlagRegex = (flagName: string) =>
  new RegExp(`useFeatureFlag\\s*\\(\\s*['"\`]${flagName}['"\`]\\s*\\)`);

const ENTRY_SEPARATOR = ";";
const NAME_VALUE_SEPARATOR = "%";
const VARIANT_SEPARATOR = "§";

export type SerializedAbbyDataResponse = { f: string; r: string; t: string };

const EMPTY_STRING = "";

export function serializeAbbyData(data: AbbyData): SerializedAbbyDataResponse {
  return {
    f:
      data.flags.length === 0
        ? EMPTY_STRING
        : data.flags
            .map((f) => `${f.name}${NAME_VALUE_SEPARATOR}${f.value ? 1 : 0}`)
            .join(ENTRY_SEPARATOR),
    r:
      data.remoteConfig.length === 0
        ? EMPTY_STRING
        : data.remoteConfig
            .map(
              (f) =>
                `${f.name}${NAME_VALUE_SEPARATOR}${JSON.stringify(f.value)}`
            )
            .join(ENTRY_SEPARATOR),
    t:
      data.tests.length === 0
        ? EMPTY_STRING
        : data.tests
            .map(
              (t) =>
                `${t.name}${NAME_VALUE_SEPARATOR}${t.weights.join(VARIANT_SEPARATOR)}`
            )
            .join(ENTRY_SEPARATOR),
  } satisfies Record<(keyof AbbyDataResponse)[0], string>;
}

function destringifyFlags(flags: string) {
  return flags.split(ENTRY_SEPARATOR).filter(Boolean);
}

export function parseAbbyData(s: SerializedAbbyDataResponse): AbbyData {
  const flags = destringifyFlags(s.f);
  const remoteConfigs = destringifyFlags(s.r);
  const tests = destringifyFlags(s.t);

  return {
    tests: tests.map((t) => {
      const [name, weights] = t.split(NAME_VALUE_SEPARATOR);
      return {
        name,
        weights: weights.split(VARIANT_SEPARATOR).map(Number),
      };
    }),
    flags: flags.map((f) => {
      const [name, value] = f.split(NAME_VALUE_SEPARATOR);
      return {
        name,
        value: Boolean(Number(value)),
      };
    }),
    remoteConfig: remoteConfigs.map((f) => {
      const [name, value] = f.split(NAME_VALUE_SEPARATOR);

      return {
        name,
        value: JSON.parse(value),
      };
    }),
  };
}

// source: https://github.com/styled-components/styled-components/blob/0aa3170c255a49cd41c3fbeb2b8051b5d132f229/src/vendor/glamor/hash.js

/**
 * Generate a numeric 32 bit hash of a string
 */

export function hashStringToInt32(str: string): number {
  // biome-ignore lint/style/noVar: copy-pasted code; works like a charm
  // biome-ignore lint/correctness/noInnerDeclarations: copy-pasted code; works like a charm
  // biome-ignore lint/suspicious/noImplicitAnyLet: copy-pasted code; works like a charm
  for (var e = str.length | 0, a = e | 0, d = 0, b; e >= 4; ) {
    (b =
      (str.charCodeAt(d) & 255) |
      ((str.charCodeAt(++d) & 255) << 8) |
      ((str.charCodeAt(++d) & 255) << 16) |
      ((str.charCodeAt(++d) & 255) << 24)),
      (b =
        1540483477 * (b & 65535) + (((1540483477 * (b >>> 16)) & 65535) << 16)),
      (b ^= b >>> 24),
      (b =
        1540483477 * (b & 65535) + (((1540483477 * (b >>> 16)) & 65535) << 16)),
      (a =
        (1540483477 * (a & 65535) +
          (((1540483477 * (a >>> 16)) & 65535) << 16)) ^
        b),
      // biome-ignore lint/style/noCommaOperator: copy-pasted code; works like a charm
      (e -= 4),
      ++d;
  }
  switch (e) {
    // biome-ignore lint/suspicious/noFallthroughSwitchClause: copy-pasted code; works like a charm
    case 3:
      a ^= (str.charCodeAt(d + 2) & 255) << 16;
    // biome-ignore lint/suspicious/noFallthroughSwitchClause: copy-pasted code; works like a charm
    case 2:
      a ^= (str.charCodeAt(d + 1) & 255) << 8;
    case 1:
      // biome-ignore lint/style/noCommaOperator: copy-pasted code; works like a charm
      (a ^= str.charCodeAt(d) & 255),
        (a =
          1540483477 * (a & 65535) +
          (((1540483477 * (a >>> 16)) & 65535) << 16));
  }
  a ^= a >>> 13;
  a = 1540483477 * (a & 65535) + (((1540483477 * (a >>> 16)) & 65535) << 16);
  return (a ^ (a >>> 15)) >>> 0;
}

export function isSerializedAbbyDataResponse(
  r: AbbyDataResponse
): r is SerializedAbbyDataResponse {
  return typeof r === "object" && "f" in r && "r" in r && "t" in r;
}
