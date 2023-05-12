import clsx from "clsx";
import { useState } from "react";
import toast from "react-hot-toast";
import { FaCopy, FaReact } from "react-icons/fa";
import { TbBrandSvelte } from "react-icons/tb";
import { TbBrandNextjs } from "react-icons/tb";
import type { CodeSnippetData, Integrations } from "utils/snippets";
import { trpc } from "utils/trpc";
import { LoadingSpinner } from "./LoadingSpinner";

const INTEGRATIONS: Record<
  Integrations,
  {
    name: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  nextjs: {
    name: "Next.js",
    icon: TbBrandNextjs,
  },
  react: {
    name: "React",
    icon: FaReact,
  },
  svelte: {
    name: "Svelte",
    icon: TbBrandSvelte
  }
};

type Props = {
  projectId: string;
};

export function BaseCodeSnippet(props: Record<Integrations, CodeSnippetData>) {
  const [currentIntegration, setCurrentIntegration] = useState<Integrations>(
    Object.keys(INTEGRATIONS)[0] as Integrations
  );

  const onCopyClick = () => {
    toast.success("Successfully copied code snippet!");
    navigator.clipboard.writeText(props[currentIntegration].code);
  };

  return (
    <div className="relative">
      <div className="absolute w-full">
        <div className="flex space-x-2 p-3">
          <div className="h-3 w-3 rounded-full bg-[#FF5F56]" />
          <div className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
          <div className="h-3 w-3 rounded-full bg-[#27C93F]" />
        </div>
        <div className="mt-2 flex w-full bg-gray-800">
          {Object.entries(INTEGRATIONS).map(([key, { icon: Icon, name }]) => (
            <div
              key={name}
              role="button"
              onClick={() => setCurrentIntegration(key as Integrations)}
              className={clsx(
                "flex cursor-pointer items-center py-2 px-3 font-semibold text-white transition-colors ease-in-out hover:bg-gray-900",
                key === currentIntegration && "bg-gray-900"
              )}
            >
              <Icon className="mr-2" />
              {name}
            </div>
          ))}
        </div>
      </div>

      <button
        title="Copy code snippet"
        aria-label="Copy code snippet"
        onClick={onCopyClick}
        className="absolute top-24 right-6 hidden rounded-lg border border-gray-300 p-3 text-white transition-colors ease-in-out hover:bg-gray-800 active:bg-gray-700 md:block"
      >
        <FaCopy />
      </button>

      <div
        dangerouslySetInnerHTML={{ __html: props[currentIntegration].html }}
      />
    </div>
  );
}

export function CodeSnippet({ projectId }: Props) {
  const { data, isLoading } = trpc.project.getCodeSnippet.useQuery({
    projectId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <LoadingSpinner height="2rem" width="2rem" />
      </div>
    );
  }
  if (!data) return null;

  return <BaseCodeSnippet {...data} />;
}
