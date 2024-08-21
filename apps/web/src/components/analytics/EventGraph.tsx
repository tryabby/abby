"use client";

import * as React from "react";
import { LineChart, CartesianGrid, XAxis, YAxis, Line } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "components/ui/chart";
import dayjs from "dayjs";
import { getFormattingByInterval } from "lib/events";

type EventList = Array<{
  date: string;
  [key: string]: string;
}>;

export function EventGraph({
  events,
  variants,
  subtitle,
  title,
  interval,
}: {
  events: EventList;
  variants: string[];
  title: string;
  subtitle: string;
  interval: string;
}) {
  const chartConfig = React.useMemo(() => {
    const variantsConfig = variants.reduce(
      (acc, variant, index) => {
        acc[variant] = {
          label: variant,
          color: `hsl(var(--chart-${index + 1}))`,
        };
        return acc;
      },
      {} as Record<string, { label: string; color: string }>
    ) as Record<string, { label: string; color: string }>;

    return {
      ...variantsConfig,
    } satisfies ChartConfig;
  }, [variants]);

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{subtitle}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <LineChart data={events} accessibilityLayer syncId="events">
            <defs>
              {variants.map((variant) => (
                <linearGradient
                  key={variant}
                  id={`fill${variant}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={`var(--color-${variant})`}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={`var(--color-${variant})`}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              // tickLine={false}
              // axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                return dayjs(value).format(getFormattingByInterval(interval));
              }}
            />
            <YAxis />
            <ChartTooltip
              labelFormatter={(value) => {
                return dayjs(value).format(getFormattingByInterval(interval));
              }}
              content={<ChartTooltipContent indicator="line" />}
            />
            {variants.map((variant) => (
              <Line
                key={variant}
                dataKey={variant}
                type="monotone"
                fill={`url(#fill${variant})`}
                stroke={`var(--color-${variant})`}
                strokeWidth={2}
                dot={false}
              />
            ))}

            <ChartLegend content={<ChartLegendContent />} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
