import { useOpenPanel } from "@openpanel/nextjs";
import { usePlausible } from "next-plausible";
import { useCallback } from "react";
import type { EventOptionsTuple } from "server/common/tracking";
import type { PlausibleEvents } from "types/plausible-events";

export const useTracking = () => {
  const trackPlausible = usePlausible<PlausibleEvents>();
  const { track: trackOpenPanel } = useOpenPanel();

  return useCallback(
    <N extends keyof PlausibleEvents>(
      eventName: N,
      ...rest: PlausibleEvents[N] extends never
        ? []
        : EventOptionsTuple<PlausibleEvents[N]>
    ) => {
      trackPlausible(eventName, ...rest);
      trackOpenPanel(eventName, ...rest);
    },
    [trackPlausible, trackOpenPanel]
  );
};
