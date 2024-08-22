import { DonutChart } from "components/charts/Donut";
import type { ProjectClientEvents } from "pages/projects/[projectId]";
import type { ClientOption } from "server/trpc/router/project";

const Metrics = ({
  actEvents,
  options,
}: {
  actEvents: ProjectClientEvents;
  options: ClientOption[];
}) => {
  const labels = options.map((option) => option.identifier);

  return (
    <div className="relative h-full w-full">
      <DonutChart
        totalVisits={actEvents.reduce((acc, e) => acc + e._count._all, 0)}
        variants={labels}
        events={actEvents}
        totalText="Interactions"
      />
    </div>
  );
};

export { Metrics };
