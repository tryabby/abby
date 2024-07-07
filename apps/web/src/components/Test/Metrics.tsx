import { Prisma, Event } from "@prisma/client";
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
  },
};

const Metrics = ({
  visitData,
}: {
  visitData: (ClientOption & { actEventCount: number })[];
}) => {
  const labels = visitData.map((data) => data.identifier);

  const absPings = visitData.reduce((accumulator, value) => {
    return accumulator + value.actEventCount;
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
              data: visitData.map((data) => data.actEventCount),

              backgroundColor: "#A9E4EF",
            },
            {
              label: "Expected",
              data: visitData.map((data) => absPings * data.chance),
              backgroundColor: "#f472b6",
            },
          ],
        }}
      />
    </div>
  );
};

export { Metrics };
