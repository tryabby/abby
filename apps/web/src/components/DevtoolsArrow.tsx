import { Transition } from "@headlessui/react";
import { CornerRightDown } from "lucide-react";
import { useState, useEffect } from "react";

export function useDevtoolsPosition() {
  const [devtoolsPosition, setDevtoolsPosition] = useState<DOMRect | null>(
    null
  );

  useEffect(() => {
    const devtools = document.getElementById("devtools-collapsed");
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

  return devtoolsPosition;
}

export function DevtoolsArrow() {
  const devtoolsPosition = useDevtoolsPosition();

  return (
    <Transition
      show={devtoolsPosition != null}
      enter="transition-opacity duration-75"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-150"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div
        className="flex items-center rounded-md bg-primary-background p-1 font-mono text-xl text-accent-background"
        style={{
          zIndex: 9999,
          position: "fixed",
          top: (devtoolsPosition?.top ?? 0) - 42,
          left: (devtoolsPosition?.left ?? 0) - 115,
        }}
      >
        Try me out <CornerRightDown className="mt-3" />
      </div>
    </Transition>
  );
}
