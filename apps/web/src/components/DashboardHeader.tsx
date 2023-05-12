import { CodeSnippetModalButton } from "./CodeSnippetModalButton";

type Props = {
  title: string;
};

export function DashboardHeader({ title }: Props) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h1 className="text-3xl font-bold">{title}</h1>
      <CodeSnippetModalButton />
    </div>
  );
}
