import { Event } from "@prisma/client";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  Title,
  Tooltip,
  ChartOptions,
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
        label: function (context) {
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
  visitData,
}: {
  visitData: (ClientOption & { visitedEventCount: number })[];
}) => {
  const labels = visitData.map((data) => data.identifier);
  const absPings = visitData.reduce((accumulator, value) => {
    console.log(value.visitedEventCount);
    return accumulator + value.visitedEventCount;
  }, 0);

  console.log("abs", absPings);

  return (
    <div className="relative h-full w-full ">
      <Bar
        className="self-end"
        options={OPTIONS}
        data={{
          labels,
          datasets: [
            {
              label: "Target",
              data: visitData.map((data) => {
                return parseFloat(data.chance.toString()) * 100;
              }),
              backgroundColor: "#A9E4EF",
            },
            {
              label: "Actual",
              data: visitData.map((data) => {
                return Math.round((data.visitedEventCount / absPings) * 100);
              }),
              backgroundColor: "#f472b6",
            },
          ],
        }}
      />
    </div>
  );
};

export { Serves };
