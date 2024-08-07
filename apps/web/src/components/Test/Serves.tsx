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
    tooltip: {
      callbacks: {
        label: (context) => {
          let label = context.dataset.label || "";

          if (label) {
            label += ": ";
          }
          if (context.parsed.y !== null) {
            label += context.parsed.y;
          }
          return `${label}%`;
        },
      },
    },
  },
};

const Serves = ({
  pingEvents,
  options,
}: {
  pingEvents: Event[];
  options: ClientOption[];
}) => {
  const labels = options.map((option) => option.identifier);

  const actualData = useMemo(() => {
    return options.map((option) => {
      return pingEvents.filter(
        (event) => event.selectedVariant === option.identifier
      ).length;
    });
  }, [options, pingEvents]);

  const absPings = actualData.reduce((accumulator, value) => {
    return accumulator + value;
  }, 0);

  return (
    <div className="relative h-full w-full">
      <Bar
        className="self-end"
        options={OPTIONS}
        data={{
          labels,
          datasets: [
            {
              label: "Target",
              data: options.map(
                (option) => Number.parseFloat(option.chance.toString()) * 100
              ),
              backgroundColor: "#A9E4EF",
            },
            {
              label: "Actual",
              data: actualData.map((data) =>
                Math.round((data / absPings) * 100)
              ),
              backgroundColor: "#f472b6",
            },
          ],
        }}
      />
    </div>
  );
};

export { Serves };
