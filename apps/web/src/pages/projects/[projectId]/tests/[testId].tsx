import { DashboardHeader } from "components/DashboardHeader";
import { Layout } from "components/Layout";
import { LoadingSpinner } from "components/LoadingSpinner";
import { Select, SelectItem } from "components/Select";
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
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData,
} from "chart.js";
import colors from "tailwindcss/colors";
import { useMemo } from "react";
import { getColorByIndex } from "lib/graphs";
import { AbbyEventType } from "@tryabby/core";
import { Button } from "components/ui/button";

const INTERVAL_PARAM_NAME = "interval";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

ChartJS.defaults.color = "white";
ChartJS.defaults.font.family = "'Fragment Mono', monospace";
ChartJS.defaults.borderColor = `${colors.gray[800]}33`;

const CHART_OPTIONS: ChartOptions<"line"> = {
  responsive: true,
  scales: {
    y: {
      min: 0,
    },
  },
  plugins: {
    legend: {
      position: "top" as const,
    },
  },
};

const getChartOptions = (index: number, variant: string) => {
  const color = getColorByIndex(index);
  return {
    label: variant,
    backgroundColor: `${color}33`,
    borderColor: color,
    fill: true,
  };
};

const TestDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const projectId = useProjectId();
  const testId = useUnsafeQueryParam("testId");
  const intervalParam = useQueryParam(INTERVAL_PARAM_NAME);

  const interval =
    intervalParam !== undefined && isValidInterval(intervalParam)
      ? intervalParam
      : INTERVALS[1].value;

  const {
    data: test,
    isLoading: isTestLoading,
    isError: isTestError,
  } = trpc.tests.getById.useQuery(
    {
      testId,
    },
    {
      enabled: !!testId,
    }
  );
  //TODO beide zusammen fassen
  const { data } = trpc.events.getEventsByTestId.useQuery(
    {
      testId,
      interval,
    },
    {
      enabled: !!testId,
    }
  );

  const events = useMemo(() => data ?? [], [data]);

  const labels = getLabelsByInterval(
    interval,
    minBy(events, "createdAt")?.startTime!
  );

  const viewEvents: ChartData<"line", number[], unknown> = useMemo(
    () => ({
      labelsAndDates: labels.labels,
      datasets: events
        .filter((event) => event.type === AbbyEventType.PING)
        .map((event, i) => {
          return {
            data: labels.dates.map((date) => {
              console.log("Label", date, event.startTime);
              return events.find((e) => e.startTime === date)?.count ?? 0;
            }),
            ...getChartOptions(i, event.selectedVariant),
          };
        }),
    }),
    [events, labels]
  );

  console.log(viewEvents);

  const actEvents: ChartData<"line", number[], unknown> = useMemo(
    () => ({
      labels: labels.labels,
      datasets: events
        .filter((event) => event.type === AbbyEventType.ACT)
        .map((event, i) => {
          return {
            data: labels.dates.map((date) => event.count),
            ...getChartOptions(i, event.selectedVariant),
          };
        }),
    }),
    [events, labels]
  );

  if (!events) return <LoadingSpinner />;

  if (isTestLoading || isTestError) {
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
          {test.name}
        </h1>
        <div className="col-span-2 w-48 justify-self-end md:col-span-1">
          <Select
            items={INTERVALS}
            value={interval}
            onChange={(newInterval) =>
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
          />
        </div>
      </div>

      {events?.length === 0 ? (
        <p className="mt-48 text-center text-lg text-gray-400">
          No events yet :(
        </p>
      ) : (
        <div>
          <div>
            <h2 className="mt-3 text-xl font-bold">Views</h2>
            <Line options={CHART_OPTIONS} data={viewEvents} />
          </div>
          <hr className="my-16 border-pink-50/20" />
          <div>
            <h2 className="mt-3 text-xl font-bold">Interactions</h2>
            <Line options={CHART_OPTIONS} data={actEvents} />
          </div>
        </div>
      )}
    </div>
  );
};

TestDetailPage.getLayout = (page) => <Layout>{page}</Layout>;

export default TestDetailPage;
