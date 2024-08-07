import { useTracking } from "lib/tracking";
import { CodeSnippetModalButton } from "./CodeSnippetModalButton";

type Props = {
  title: string;
};

export function DashboardHeader({ title }: Props) {
  const _trackEvent = useTracking();
  return (
    <div className="mb-4 flex items-center justify-between">
      <h1 className="text-3xl font-bold">{title}</h1>
      <div className="flex space-x-2">
        <CodeSnippetModalButton />
      </div>
    </div>
  );
}
