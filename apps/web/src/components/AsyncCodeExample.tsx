import { trpc } from 'utils/trpc';
import { BaseCodeSnippet } from './CodeSnippet';
import { LoadingSpinner } from './LoadingSpinner';

export function AsyncCodeExample() {
  const { data, isLoading } = trpc.example.exampleSnippet.useQuery();

  if (isLoading) {
    return (
      <div className='flex items-center justify-center'>
        <LoadingSpinner height='2rem' width='2rem' />
      </div>
    );
  }
  if (!data) return null;

  return <BaseCodeSnippet {...data} />;
}
