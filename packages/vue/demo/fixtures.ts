import type { AbbyDataResponse } from "@tryabby/core";

/** Synthetic public configuration. No project account, user data or API key. */
export function createInitialData(
  selected: "calm" | "bright" = "calm"
): AbbyDataResponse {
  return {
    tests: [
      { name: "welcome", weights: selected === "calm" ? [1, 0] : [0, 1] },
    ],
    flags: [{ name: "showDetails", value: true }],
    remoteConfig: [
      { name: "headline", value: "A little change. A live result." },
      { name: "previewCount", value: 3 },
      { name: "appearance", value: { tone: "peach", rounded: true } },
    ],
  };
}
