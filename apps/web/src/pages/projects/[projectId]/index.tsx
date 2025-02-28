import type { inferRouterOutputs } from "@trpc/server";
import { AddABTestModal } from "components/AddABTestModal";
import { DashboardHeader } from "components/DashboardHeader";
import { Layout } from "components/Layout";
import { FullPageLoadingSpinner } from "components/LoadingSpinner";
import Section from "components/Test/Section";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import Fuse from "fuse.js";
import { useProjectId } from "lib/hooks/useProjectId";
import { Search } from "lucide-react";
import type { GetStaticPaths, GetStaticProps } from "next";
import type { NextPageWithLayout } from "pages/_app";
import { useMemo, useState } from "react";
import { AiOutlinePlus } from "react-icons/ai";
import type { AppRouter } from "server/trpc/router/_app";
import { trpc } from "utils/trpc";

export type ProjectClientEvents =
  inferRouterOutputs<AppRouter>["project"]["getProjectData"]["project"]["tests"][number]["pingEvents"];

const Projects: NextPageWithLayout = () => {
  const [isCreateTestModalOpen, setIsCreateTestModalOpen] = useState(false);
  const [query, setQuery] = useState<string>("");
  const projectId = useProjectId();

  const { data, isLoading, isError } = trpc.project.getProjectData.useQuery({
    projectId: projectId,
  });

  const fuse = useMemo(
    () => new Fuse(data?.project.tests ?? [], { keys: ["name"] }),
    [data?.project?.tests]
  );

  const filteredTests = useMemo(() => {
    if (!query) return data?.project.tests ?? [];
    const results = fuse.search(query);
    return results.map((result) => result.item);
  }, [query, fuse.search, data?.project.tests]);

  if (isLoading || isError) return <FullPageLoadingSpinner />;

  if (data.project.tests.length === 0)
    return (
      <div className="mt-48 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-semibold">
          You don&apos;t have any A/B tests yet!
        </h1>
        <Button className="mt-4" onClick={() => setIsCreateTestModalOpen(true)}>
          Create a Test
        </Button>
        <AddABTestModal
          isOpen={isCreateTestModalOpen}
          onClose={() => setIsCreateTestModalOpen(false)}
          projectId={projectId}
        />
      </div>
    );

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="relative w-[300px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tests..."
              className="w-full pl-8"
              onChange={(e) => {
                setQuery(e.target.value);
              }}
            />
          </div>
          <Button
            className="flex items-center space-x-2"
            onClick={() => setIsCreateTestModalOpen(true)}
          >
            <AiOutlinePlus className="h-4 w-4" /> <span>Add Test</span>
          </Button>
          <AddABTestModal
            isOpen={isCreateTestModalOpen}
            onClose={() => setIsCreateTestModalOpen(false)}
            projectId={projectId}
          />
        </div>

        <div className="space-y-4">
          {filteredTests.map((test) => (
            <Section
              key={test.id}
              {...test}
              actEvents={test.actEvents}
              pingEvents={test.pingEvents}
            />
          ))}
        </div>
      </div>
    </>
  );
};

Projects.getLayout = (page) => (
  <Layout>
    <DashboardHeader title="A/B Tests" />
    {page}
  </Layout>
);

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

export default Projects;
