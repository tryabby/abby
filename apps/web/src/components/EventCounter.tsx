import {} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "utils/trpc";

export function EventCounter() {
  const { data } = trpc.events.getEventCount.useQuery();

  return (
    <div className="p-8 text-xl font-bold text-primary mx-auto flex space-x-1">
      <AnimatePresence mode="popLayout">
        <motion.span
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.3 }}
          aria-live="polite"
        >
          {new Intl.NumberFormat("en", { notation: "compact" }).format(
            data ?? 0
          )}
        </motion.span>
      </AnimatePresence>
      <span className="w-full text-white">
        Events processed and counting...
      </span>
    </div>
  );
}
