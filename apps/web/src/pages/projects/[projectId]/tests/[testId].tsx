import { DashboardHeader } from "components/DashboardHeader";
import { IconButton } from "components/IconButton";
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
} from "chart.js";
import colors from "tailwindcss/colors";
import { useMemo } from "react";
import { getColorByIndex } from "lib/graphs";
import { AbbyEventType } from "@tryabby/core";

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

  const { data: events } = trpc.events.getEventsByTestId.useQuery(
    {
      testId,
      interval,
    },
    {
      enabled: !!testId,
    }
  );

  const eventsByVariant = useMemo(() => {
    const eventsByVariant = groupBy(events, (e) => e.selectedVariant);
    // make sure all variants are present
    test?.options.map((option) => {
      eventsByVariant[option.identifier] ??= [];
    });
    return eventsByVariant;
  }, [events, test?.options]);

  const labels = getLabelsByInterval(
    interval,
    minBy(events, "createdAt")?.createdAt!
  );

  const formattedEvents = useMemo(() => {
    return Object.entries(eventsByVariant).map(([variant, events], i) => {
      const eventsByDate = groupBy(events, (e) => {
        const date = dayjs(e.createdAt);
        // round by 3 hours
        const hour = Math.floor(date.hour() / 3) * 3;

        return date
          .set("hour", hour)
          .set("minute", 0)
          .format(getFormattingByInterval(interval));
      });
      return { eventsByDate, variant };
    });
  }, [eventsByVariant, interval]);

  const viewEvents = useMemo(
    () => ({
      labels,
      datasets: formattedEvents.map(({ eventsByDate, variant }, i) => {
        return {
          data: labels.map(
            (label) =>
              eventsByDate[label]?.filter((e) => e.type === AbbyEventType.PING)
                ?.length ?? 0
          ),
          ...getChartOptions(i, variant),
        };
      }),
    }),
    [formattedEvents, labels]
  );

  const actEvents = useMemo(
    () => ({
      labels,
      datasets: formattedEvents.map(({ eventsByDate, variant }, i) => {
        return {
          data: labels.map(
            (label) =>
              eventsByDate[label]?.filter((e) => e.type === AbbyEventType.ACT)
                ?.length ?? 0
          ),
          ...getChartOptions(i, variant),
        };
      }),
    }),
    [formattedEvents, labels]
  );

  if (isTestLoading || isTestError) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="grid grid-cols-[auto,1fr] items-center gap-x-4 gap-y-2 md:grid-cols-[auto,1fr,auto]">
        <IconButton
          as={Link}
          href={`/projects/${projectId}`}
          icon={<BiArrowBack />}
          title="Back to Tests"
        />
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
