import { AddABTestModal } from 'components/AddABTestModal'
import { DashboardHeader } from 'components/DashboardHeader'
import { Layout } from 'components/Layout'
import { FullPageLoadingSpinner } from 'components/LoadingSpinner'
import Section from 'components/Test/Section'
import { useProjectId } from 'lib/hooks/useProjectId'
import { NextPageWithLayout } from 'pages/_app'
import { useState } from 'react'
import { AiOutlinePlus } from 'react-icons/ai'
import { trpc } from 'utils/trpc'
import { Button } from 'components/ui/button'
import { GetStaticProps, GetStaticPaths } from 'next'

const Projects: NextPageWithLayout = () => {
  const [isCreateTestModalOpen, setIsCreateTestModalOpen] = useState(false)

  const projectId = useProjectId()

  const { data, isLoading, isError } = trpc.project.getProjectData.useQuery({
    projectId: projectId,
  })

  if (isLoading || isError) return <FullPageLoadingSpinner />

  if (data.project.tests.length === 0)
    return (
      <div className='mt-48 flex flex-col items-center justify-center'>
        <h1 className='text-2xl font-semibold'>You don&apos;t have any A/B tests yet!</h1>
        <Button
          className='mt-4 text-primary-foreground'
          onClick={() => setIsCreateTestModalOpen(true)}
        >
          Create a Test
        </Button>
        <AddABTestModal
          isOpen={isCreateTestModalOpen}
          onClose={() => setIsCreateTestModalOpen(false)}
          projectId={projectId}
        />
      </div>
    )
  return (
    <>
      <div className='flex justify-end space-x-2'>
        <Button
          className='mb-4 flex items-center space-x-2'
          onClick={() => setIsCreateTestModalOpen(true)}
          variant='secondary'
        >
          <AiOutlinePlus /> <span>Add Test</span>
        </Button>
        <AddABTestModal
          isOpen={isCreateTestModalOpen}
          onClose={() => setIsCreateTestModalOpen(false)}
          projectId={projectId}
        />
      </div>
      <div className='space-y-8'>
        {data?.project?.tests.map((test) => (
          <Section key={test.id} {...test} events={test.events}></Section>
        ))}
      </div>
    </>
  )
}

Projects.getLayout = (page) => (
  <Layout>
    <DashboardHeader title='A/B Tests' />
    {page}
  </Layout>
)

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {},
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: true,
  }
}

export default Projects
