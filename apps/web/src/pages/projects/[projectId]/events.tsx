import { DashboardHeader } from "components/DashboardHeader";
import { Layout } from "components/Layout";
import { FullPageLoadingSpinner } from "components/LoadingSpinner";

import { Avatar } from "components/Avatar";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useProjectId } from "lib/hooks/useProjectId";
import { GetStaticPaths, GetStaticProps } from "next";
import { NextPageWithLayout } from "pages/_app";
import { trpc } from "utils/trpc";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "components/ui/table";
import { Button } from "components/ui/button";

dayjs.extend(relativeTime);

function getValueClass(value: string | null) {
  if (value === "true") return "text-green-500";
  if (value === "false") return "text-red-500";
  return "text-gray-500 font-medium";
}

const EventsPage: NextPageWithLayout = () => {
  const projectId = useProjectId();

  const getEventLogsQuery = trpc.project.getEventLogs.useInfiniteQuery(
    {
      projectId,
    },
    {
      enabled: !!projectId,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  if (getEventLogsQuery.isLoading || getEventLogsQuery.isError)
    return <FullPageLoadingSpinner />;

  return (
    <Table>
      <TableCaption>
        <Button
          disabled={!getEventLogsQuery.hasNextPage}
          onClick={() => getEventLogsQuery.fetchNextPage()}
        >
          Load More
        </Button>
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Flag</TableHead>
          <TableHead className="w-[100px]">Environment</TableHead>
          <TableHead>Change</TableHead>
          <TableHead>User</TableHead>
          <TableHead className="text-right">Event Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {getEventLogsQuery.data.pages.flatMap((p) =>
          p.items.map((event) => (
            <TableRow key={event.id}>
              <TableCell className="font-medium">
                {event.flagValue.flag.name}
              </TableCell>
              <TableCell>{event.flagValue.environment.name}</TableCell>
              <TableCell>
                <span className={getValueClass(event.oldValue)}>
                  {event.oldValue ?? "unset"}
                </span>{" "}
                →{" "}
                <span className={getValueClass(event.newValue)}>
                  {event.newValue ?? "unset"}
                </span>
              </TableCell>
              <TableCell className="align-center flex space-x-3">
                <Avatar
                  userName={event.user.name ?? event.user.email ?? undefined}
                  imageUrl={event.user.image ?? undefined}
                  className="h-5 w-5 rounded-lg text-[10px]"
                />
                <span>
                  {event.user.name ?? event.user.email ?? "Deleted User"}
                </span>
              </TableCell>
              <TableCell
                className="text-right"
                title={event.createdAt.toLocaleString()}
              >
                {dayjs(event.createdAt).fromNow()}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

EventsPage.getLayout = (page) => {
  return (
    <Layout>
      <DashboardHeader title="Event Log" />
      {page}
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {},
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: true,
  };
};

export default EventsPage;
