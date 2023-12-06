import { DashboardHeader } from "components/DashboardHeader";
import { Layout } from "components/Layout";
import { LoadingSpinner } from "components/LoadingSpinner";
import {
  getFormattingByInterval,
  getLabelsByInterval,
  INTERVALS,
  isValidInterval,
} from "lib/events";
import { useProjectId } from "lib/hooks/useProjectId";
import { useQueryParam, useUnsafeQueryParam } from "lib/hooks/useQueryParam";
import Link from "next/link";
import { useRouter } from "next/router";
import { NextPageWithLayout } from "pages/_app";
import { Line } from "react-chartjs-2";
import { BiArrowBack } from "react-icons/bi";
import { trpc } from "utils/trpc";
import { groupBy, minBy } from "lodash-es";
import dayjs from "dayjs";

import colors from "tailwindcss/colors";
import { useMemo } from "react";
import { getColorByIndex } from "lib/graphs";
import { AbbyEventType } from "@tryabby/core";
import { Button } from "components/ui/button";
import {
  AreaChart,
  Card,
  Divider,
  Metric,
  Text,
  ValueFormatter,
  Title,
} from "@tremor/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";

const INTERVAL_PARAM_NAME = "interval";

const getChartOptions = (index: number, variant: string) => {
  const color = getColorByIndex(index);
  return {
    label: variant,
    backgroundColor: `${color}33`,
    borderColor: color,
    fill: true,
  };
};

const data = [
  {
    Month: "Jan 21",
    "Gross Volume": 2890,
    "Successful Payments": 2400,
    Customers: 4938,
  },
  {
    Month: "Feb 21",
    "Gross Volume": 1890,
    "Successful Payments": 1398,
    Customers: 2938,
  },
  // ...
  {
    Month: "Jan 22",
    "Gross Volume": 3890,
    "Successful Payments": 2980,
    Customers: 2645,
  },
];

const TestDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const projectId = useProjectId();
  const testId = useUnsafeQueryParam("testId");
  const intervalParam = useQueryParam(INTERVAL_PARAM_NAME);

  const interval =
    intervalParam !== undefined && isValidInterval(intervalParam)
      ? intervalParam
      : INTERVALS[1].value;

  const { data, isLoading, isError } = trpc.events.getEventsByTestId.useQuery(
    {
      testId,
      interval,
    },
    {
      enabled: !!testId,
    }
  );

  const viewEvents = useMemo(
    () => data?.events?.filter((e) => e.type === AbbyEventType.PING),
    [data?.events]
  );

  const actEvents = useMemo(
    () => data?.events?.filter((e) => e.type === AbbyEventType.ACT),
    [data?.events]
  );

  const viewEventsByDay = useMemo(() => {
    const eventsByDay = groupBy(viewEvents, (e) => {
      const date = dayjs(e.createdAt);
      // round by 3 hours
      const hour = Math.floor(date.hour() / 3) * 3;

      return date
        .set("hour", hour)
        .set("minute", 0)
        .format(getFormattingByInterval(interval));
    });
    return Object.entries(eventsByDay).map(([day, events]) => {
      return {
        day,
        ...data?.variants.reduce<Record<string, number>>((acc, variant) => {
          acc[variant] = events.filter(
            (e) => e.selectedVariant === variant
          ).length;
          return acc;
        }, {}),
      };
    });
  }, [data?.variants, interval, viewEvents]);

  const actEventsByDay = useMemo(() => {
    const eventsByDay = groupBy(actEvents, (e) => {
      const date = dayjs(e.createdAt);
      // round by 3 hours
      const hour = Math.floor(date.hour() / 3) * 3;

      return date
        .set("hour", hour)
        .set("minute", 0)
        .format(getFormattingByInterval(interval));
    });
    return Object.entries(eventsByDay).map(([day, events]) => {
      return {
        day,
        ...data?.variants.reduce<Record<string, number>>((acc, variant) => {
          acc[variant] = events.filter(
            (e) => e.selectedVariant === variant
          ).length;
          return acc;
        }, {}),
      };
    });
  }, [data?.variants, interval, actEvents]);

  if (isLoading || isError) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="grid grid-cols-[auto,1fr] items-center gap-x-4 gap-y-2 md:grid-cols-[auto,1fr,auto]">
        <Link href={`/projects/${projectId}`} className="contents">
          <Button size="icon" variant="secondary" title="Back to Tests">
            <BiArrowBack />
          </Button>
        </Link>
        <h1 className="justify-self-end text-2xl font-bold text-pink-100 md:justify-self-auto">
          {data.testName}
        </h1>
        <div className="col-span-2 w-48 justify-self-end md:col-span-1">
          <Select
            value={interval}
            onValueChange={(newInterval) =>
              router.push(
                {
                  ...router,
                  query: {
                    ...router.query,
                    [INTERVAL_PARAM_NAME]: newInterval,
                  },
                },
                undefined,
                { shallow: true }
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an interval" />
            </SelectTrigger>
            <SelectContent>
              {INTERVALS.map((interval) => (
                <SelectItem key={interval.value} value={interval.value}>
                  {interval.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {data.events == null || data.events.length === 0 ? (
        <p className="mt-48 text-center text-lg text-gray-400">
          No events yet :(
        </p>
      ) : (
        <Card className="mx-auto mt-12">
          <Title>Views</Title>
          <Text>Amount of times your A/B Test has been viewed</Text>
          <AreaChart
            className="mt-8 h-60"
            data={viewEventsByDay ?? []}
            categories={data?.variants ?? []}
            index="day"
            colors={["pink", "indigo"]}
            onValueChange={() => {}}
            connectNulls
          />

          <Divider className="py-24" />

          <Title>Conversions</Title>
          <Text>Conversions are your predefined goals</Text>
          <AreaChart
            className="mt-8 h-60"
            data={actEventsByDay ?? []}
            categories={data?.variants ?? []}
            index="day"
            colors={["pink", "indigo"]}
            onValueChange={() => {}}
            connectNulls
          />

          <Divider />
        </Card>
      )}
    </div>
  );
};

TestDetailPage.getLayout = (page) => <Layout>{page}</Layout>;

export default TestDetailPage;
