import { Dialog } from "@headlessui/react";
import { useRouter } from "next/router";
import { useState } from "react";
import { BsCodeSlash } from "react-icons/bs";
import { CodeSnippet } from "./CodeSnippet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./DropdownMenu";
import { Code, Copy } from "lucide-react";
import { useProjectId } from "lib/hooks/useProjectId";
import { toast } from "react-hot-toast";
import { useTracking } from "lib/tracking";
import { Button } from "./ui/button";

function CodeSnippetModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const projectId = useRouter().query.projectId as string;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* The backdrop, rendered as a fixed sibling to the panel container */}
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />

      {/* Full-screen container to center the panel */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        {/* The actual dialog panel  */}
        <Dialog.Panel className="mx-auto w-full max-w-4xl">
          <CodeSnippet projectId={projectId} />
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

export function CodeSnippetModalButton() {
  const trackEvent = useTracking();
  const projectId = useProjectId();
  const [isOpen, setIsOpen] = useState(false);

  const onCopyProjectId = async () => {
    toast.promise(navigator.clipboard.writeText(projectId), {
      loading: "Copying to clipboard...",
      error: "Failed to copy to clipboard",
      success: "Copied Project ID to clipboard",
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
        // all other events are prevented by radix :(
        onPointerDown={() => {
          trackEvent("Dashboard Code Clicked");
        }}
      >
        <Button size="icon" variant="secondary" title="">
          <BsCodeSlash size={20} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end">
        <DropdownMenuItem onClick={onCopyProjectId}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Project ID
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setIsOpen(true)}>
          <Code className="mr-2 h-4 w-4" />
          Generate Code Snippet
        </DropdownMenuItem>
      </DropdownMenuContent>
      <CodeSnippetModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </DropdownMenu>
  );
}
