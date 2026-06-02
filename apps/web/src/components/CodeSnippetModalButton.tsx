import { DOCS_URL } from "@tryabby/core";
import { useProjectId } from "lib/hooks/useProjectId";
import { useTracking } from "lib/tracking";
import { Copy, Terminal } from "lucide-react";
import { toast } from "react-hot-toast";
import { BsCodeSlash } from "react-icons/bs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./DropdownMenu";
import { Button } from "./ui/button";

export function CodeSnippetModalButton() {
  const trackEvent = useTracking();
  const projectId = useProjectId();

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
        <DropdownMenuItem
          onClick={() => {
            trackEvent("Dashboard CLI Instructions Clicked");
            window.open(
              `${DOCS_URL}reference/cli`,
              "_blank",
              "noopener,noreferrer"
            );
          }}
        >
          <Terminal className="mr-2 h-4 w-4" />
          Setup via CLI
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
