import { TestConversion } from "@prisma/client";
import { DonutChart, Text } from "@tremor/react";
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
  pingEvents,
  options,
}: {
  pingEvents: TestConversion[];
  options: ClientOption[];
}) => {
  const actualData = useMemo(() => {
    return options.map((option) => {
      return {
        name: option.identifier,
        count: pingEvents.filter(
          (event) => event.selectedVariant === option.identifier
        ).length,
      };
    });
  }, [options, pingEvents]);

  const absPings = actualData.reduce((accumulator, value) => {
    return accumulator + value.count;
  }, 0);

  const expectedData = useMemo(() => {
    return options.map((option) => ({
      name: option.identifier,
      count: absPings * option.chance,
    }));
  }, [absPings, options]);

  return (
    <div className="relative grid h-full w-full gap-y-4 md:grid-cols-2">
      <div className="flex flex-col items-center space-y-3">
        <Text>Conversions</Text>
        <DonutChart
          data={actualData}
          category="count"
          index="name"
          colors={["pink", "indigo"]}
        />
      </div>
      <div className="flex flex-col items-center space-y-3">
        <Text>Expected</Text>
        <DonutChart
          data={expectedData}
          category="count"
          index="name"
          colors={["pink", "indigo"]}
        />
      </div>
    </div>
  );
};

export { Metrics };
