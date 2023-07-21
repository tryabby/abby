import { Layout } from "components/Layout";
import { AddABTestModal } from "components/AddABTestModal";
import { DashboardHeader } from "components/DashboardHeader";
import { FullPageLoadingSpinner } from "components/LoadingSpinner";
import Section from "components/Test/Section";
import { useProjectId } from "lib/hooks/useProjectId";
import { NextPageWithLayout } from "pages/_app";
import { useState } from "react";
import { AiOutlinePlus } from "react-icons/ai";
import { trpc } from "utils/trpc";
import { useSession } from "next-auth/react";

const Projects: NextPageWithLayout = () => {
  const [isCreateTestModalOpen, setIsCreateTestModalOpen] = useState(false);

  const { data: sessionData } = useSession();
  const projectId = useProjectId();

  const { data, isLoading, isError } = trpc.project.getProjectData.useQuery({
    projectId: projectId,
  });

  if (isLoading || isError) return <FullPageLoadingSpinner />;

  if (data.project.tests.length === 0)
    return (
      <div className="mt-48 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-semibold">
          You don&apos;t have any A/B tests yet!
        </h1>
        <button
          className="mt-4 rounded-md bg-pink-600 px-4 py-2 font-semibold text-white transition-colors duration-200 hover:bg-pink-700"
          onClick={() => setIsCreateTestModalOpen(true)}
        >
          Create a Test
        </button>
        <AddABTestModal
          isOpen={isCreateTestModalOpen}
          onClose={() => setIsCreateTestModalOpen(false)}
          projectId={projectId}
        />
      </div>
    );
  return (
    <>
      <div className="flex justify-end space-x-2">
        <button
          className="mb-4 flex items-center space-x-2 rounded-md bg-pink-600 px-4 py-2 text-white"
          onClick={() => setIsCreateTestModalOpen(true)}
        >
          <AiOutlinePlus /> <span>Add Test</span>
        </button>
        <AddABTestModal
          isOpen={isCreateTestModalOpen}
          onClose={() => setIsCreateTestModalOpen(false)}
          projectId={projectId}
        />
      </div>
      <div className="space-y-8">
        {data?.project?.tests.map((test) => (
          <Section key={test.id} {...test} events={test.events}></Section>
        ))}
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

export default Projects;
