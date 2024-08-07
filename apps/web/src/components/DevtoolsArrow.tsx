import { AnimatePresence, motion } from "framer-motion";
import { useTracking } from "lib/tracking";
import { CornerRightDown } from "lucide-react";

import { useEffect, useState } from "react";

const DEVTOOLS_ID = "abby-devtools-collapsed";

export function useDevtoolsPosition() {
  const [devtoolsPosition, setDevtoolsPosition] = useState<DOMRect | null>(
    null
  );
  const trackEvent = useTracking();

  useEffect(() => {
    const devtools = document.getElementById(DEVTOOLS_ID);

    if (!devtools) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries[0]) return;

      setDevtoolsPosition(devtools.getBoundingClientRect());
      // we only need to set it once
      resizeObserver.disconnect();
    });

    resizeObserver.observe(devtools);

    setDevtoolsPosition(devtools.getBoundingClientRect());

    const devtoolsAnalytics = () => {
      trackEvent("Devtools Opened");
    };
    devtools.addEventListener("click", devtoolsAnalytics);

    return () => {
      resizeObserver.disconnect();
      devtools.removeEventListener("click", devtoolsAnalytics);
    };
  }, [trackEvent]);

  // listen to window resize
  useEffect(() => {
    const onResize = () => {
      const devtools = document.getElementById(DEVTOOLS_ID);

      if (!devtools) return;

      setDevtoolsPosition(devtools.getBoundingClientRect());
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return devtoolsPosition;
}

export function DevtoolsArrow() {
  const trackEvent = useTracking();
  const devtoolsPosition = useDevtoolsPosition();

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      const messageType = e.data.type;
      if (!messageType?.startsWith("abby:")) return;

      switch (messageType) {
        case "abby:update-flag": {
          trackEvent("Devtools Interaction", {
            props: {
              type: "Flag Updated",
            },
          });
          break;
        }
        case "abby:select-variant": {
          trackEvent("Devtools Interaction", {
            props: {
              type: "Variant Selected",
            },
          });
          break;
        }
      }
    };

    window.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, [trackEvent]);

  return (
    <AnimatePresence>
      {devtoolsPosition && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="flex items-center rounded-md bg-ab_primary-background p-1 font-mono text-xl text-ab_accent-background"
          style={{
            zIndex: 9999,
            position: "fixed",
            top: (devtoolsPosition?.top ?? 0) - 42,
            left: (devtoolsPosition?.left ?? 0) - 115,
          }}
        >
          Try me out <CornerRightDown className="mt-3" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
