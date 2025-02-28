"use client";
import { Label, Pie, PieChart } from "recharts";

import { DOCS_URL } from "@tryabby/core";
import { Card, CardContent, CardFooter } from "components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "components/ui/chart";
import Link from "next/link";
import type { ProjectClientEvents } from "pages/projects/[projectId]";
import { useMemo } from "react";

export function DonutChart({
  totalVisits,
  variants,
  events,
  totalText,
}: {
  totalVisits: number;
  totalText: string;
  variants: string[];
  events: ProjectClientEvents;
}) {
  const chartConfig = useMemo(
    () =>
      ({
        visitors: {
          label: "Visitors",
        },
        ...variants.reduce((acc, v, i) => {
          acc[v] = {
            label: v,
            color: `hsl(var(--chart-${i + 1}))`,
          };
          return acc;
        }, {} as ChartConfig),
      }) satisfies ChartConfig,
    [variants]
  );

  const chartData = useMemo(() => {
    return events.map((event) => ({
      variant: event.selectedVariant,
      events: event._count._all,
      fill: `var(--color-${event.selectedVariant})`,
    }));
  }, [events]);

  const hasNoData = useMemo(
    () => chartData.length === 0 || chartData.every((e) => e.events === 0),
    [chartData]
  );
  return (
    <Card className="flex flex-col shadow-none w-full h-full">
      <CardContent className="flex-1 pb-0 h-full">
        {hasNoData ? (
          <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 leading-none text-muted-foreground text-sm text-center">
            Unfortunatly, there is no data to display.
            <br />
            <br />
            Start by sending events from your app.
            <br />
            <br />
            Read more in the{" "}
            <Link href={DOCS_URL} className="underline text-primary">
              docs
            </Link>
            .
          </p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[250px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="events"
                nameKey="variant"
                innerRadius={60}
                strokeWidth={5}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {totalVisits.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground"
                          >
                            {totalText}
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
              <ChartLegend
                content={<ChartLegendContent nameKey="variant" />}
                className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
              />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
      {!hasNoData && (
        <CardFooter className="flex-col gap-2 text-sm">
          {/* <div className="flex items-center gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div> */}
          <div className="leading-none text-muted-foreground">
            Showing total visitors for the 30 days
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
