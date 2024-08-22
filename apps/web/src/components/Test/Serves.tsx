import { DonutChart } from "components/charts/Donut";
import type { ProjectClientEvents } from "pages/projects/[projectId]";
import type { ClientOption } from "server/trpc/router/project";

const Serves = ({
  pingEvents,
  options,
}: {
  pingEvents: ProjectClientEvents;
  options: ClientOption[];
}) => {
  const labels = options.map((option) => option.identifier);

  return (
    <div className="relative h-full w-full">
      <DonutChart
        totalVisits={pingEvents.reduce((acc, e) => acc + e._count._all, 0)}
        variants={labels}
        events={pingEvents}
        totalText="Visits"
      />
    </div>
  );
};

export { Serves };
