import type { Event } from "@prisma/client";
import { DonutChart } from "components/charts/Donut";
import { useMemo } from "react";
import type { ClientOption } from "server/trpc/router/project";

const Metrics = ({
  actEvents,
  options,
}: {
  actEvents: Event[];
  options: ClientOption[];
}) => {
  const labels = options.map((option) => option.identifier);
  const actualData = useMemo(() => {
    return options.map((option) => {
      return {
        variant: option.identifier,
        events: actEvents.filter(
          (event) => event.selectedVariant === option.identifier
        ).length,
      };
    });
  }, [options, actEvents]);

  const absPings = actualData.reduce((accumulator, value) => {
    return accumulator + value.events;
  }, 0);

  return (
    <div className="relative h-full w-full">
      <DonutChart
        totalVisits={absPings}
        variants={labels}
        events={actualData}
        totalText="Interactions"
      />
    </div>
  );
};

export { Metrics };
