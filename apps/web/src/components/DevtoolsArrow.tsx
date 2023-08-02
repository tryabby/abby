import { AnimatePresence, motion } from "framer-motion";
import { CornerRightDown } from "lucide-react";
import { useState, useEffect } from "react";

const DEVTOOLS_ID = "abby-devtools-collapsed";

export function useDevtoolsPosition() {
  const [devtoolsPosition, setDevtoolsPosition] = useState<DOMRect | null>(
    null
  );

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

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

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
  const devtoolsPosition = useDevtoolsPosition();

  return (
    <AnimatePresence>
      {devtoolsPosition && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="flex items-center rounded-md bg-primary-background p-1 font-mono text-xl text-accent-background"
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
