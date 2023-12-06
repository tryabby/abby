import { TestConversion } from "@prisma/client";
import { Card, DeltaBar, DonutChart, Text, Title } from "@tremor/react";

import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import type { ClientOption } from "server/trpc/router/project";

const Serves = ({
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
        <Text>Views</Text>
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

export { Serves };
