import type { Event } from "@prisma/client";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  type ChartOptions,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import type { ClientOption } from "server/trpc/router/project";

ChartJS.defaults.font.family = "Mona Sans";
ChartJS.defaults.color = "white";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const OPTIONS: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      min: 0,
      max: 100,
    },
  },
  plugins: {
    legend: {
      position: "top" as const,
    },
  },
};

const Metrics = ({
  pingEvents,
  options,
}: {
  pingEvents: Event[];
  options: ClientOption[];
}) => {
  const labels = options.map((option) => option.identifier);
  const actualData = useMemo(() => {
    return options.map((option) => {
      return {
        pings: pingEvents.filter(
          (event) => event.selectedVariant === option.identifier
        ).length,
        weight: option.chance,
      };
    });
  }, [options, pingEvents]);

  const absPings = actualData.reduce((accumulator, value) => {
    return accumulator + value.pings;
  }, 0);

  return (
    <div className="relative mb-6 h-full w-full">
      <Bar
        className="self-end"
        options={OPTIONS}
        data={{
          labels,
          datasets: [
            {
              label: "Actual",
              data: actualData.map((d) => d.pings),
              backgroundColor: "#A9E4EF",
            },
            {
              label: "Expected",
              data: actualData.map((data) => absPings * data.weight),
              backgroundColor: "#f472b6",
            },
          ],
        }}
      />
    </div>
  );
};

export { Metrics };
