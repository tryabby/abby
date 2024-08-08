import { Layout } from "components/Layout";
import { LoadingSpinner } from "components/LoadingSpinner";
import { EventGraph } from "components/analytics/EventGraph";
import { Button } from "components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import { INTERVALS, isValidInterval } from "lib/events";
import { useProjectId } from "lib/hooks/useProjectId";
import { useQueryParam, useUnsafeQueryParam } from "lib/hooks/useQueryParam";
import Link from "next/link";
import { useRouter } from "next/router";
import type { NextPageWithLayout } from "pages/_app";
import { BiArrowBack } from "react-icons/bi";
import { trpc } from "utils/trpc";

const INTERVAL_PARAM_NAME = "interval";

const TestDetailPage: NextPageWithLayout = () => {
  const router = useRouter();
  const projectId = useProjectId();
  const testId = useUnsafeQueryParam("testId");
  const intervalParam = useQueryParam(INTERVAL_PARAM_NAME);

  const interval =
    intervalParam !== undefined && isValidInterval(intervalParam)
      ? intervalParam
      : INTERVALS[1].value;

  const getEventsQuery = trpc.events.getEventsByTestId.useQuery(
    {
      testId,
      interval,
    },
    {
      enabled: !!testId,
    }
  );

  if (getEventsQuery.isLoading || getEventsQuery.isError) {
    return <LoadingSpinner />;
  }

  /**
   *  needed for the graph
   * 1. list of all events. sorted by date
   * 2. each entry has a key for each variant and the number of events for that variant
   */

  return (
    <div>
      <div className="grid grid-cols-[auto,1fr] items-center gap-x-4 gap-y-2 md:grid-cols-[auto,1fr,auto]">
        <Link href={`/projects/${projectId}`} className="contents">
          <Button size="icon" variant="secondary" title="Back to Tests">
            <BiArrowBack />
          </Button>
        </Link>
        <h1 className="justify-self-end text-2xl font-bold text-pink-100 md:justify-self-auto">
          {getEventsQuery.data.currentTest.name}
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
            <SelectTrigger
              className="w-[160px] rounded-lg sm:ml-auto"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {INTERVALS.map((i) => (
                <SelectItem
                  key={i.value}
                  value={i.value}
                  className="rounded-lg"
                >
                  {i.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-8 flex flex-col space-y-8">
        <EventGraph
          title="Visits"
          subtitle="The amount of times a user has seen this test"
          events={getEventsQuery.data.pingEvents ?? []}
          variants={getEventsQuery.data.potentialVariants}
          interval={interval}
        />
        <EventGraph
          title="Conversions"
          subtitle="The amount of times a user has converted in this test"
          events={getEventsQuery.data.actEvents ?? []}
          variants={getEventsQuery.data.potentialVariants}
          interval={interval}
        />
      </div>
    </div>
  );
};

TestDetailPage.getLayout = (page) => <Layout>{page}</Layout>;

export default TestDetailPage;
