import { cn } from "lib/utils";
import { useProjectId } from "lib/hooks/useProjectId";
import { useTracking } from "lib/tracking";
import { Check, Copy, ExternalLink, Terminal } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { BsCodeSlash } from "react-icons/bs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./DropdownMenu";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

function CliInstructionsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [packageManager, setPackageManager] = useState<"npm" | "pnpm" | "yarn">(
    "npm"
  );

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const installCommands = {
    npm: "npm i -g @tryabby/cli",
    pnpm: "pnpm i -g @tryabby/cli",
    yarn: "yarn add -g @tryabby/cli",
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl border-zinc-800 bg-zinc-950 p-6 text-zinc-100 sm:rounded-xl">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <Terminal className="h-5 w-5 text-pink-500" />
            <DialogTitle className="text-xl font-bold text-white">
              Abby CLI Instructions
            </DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400">
            Configure feature flags, remote configs, and A/B tests directly from
            your terminal.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          {/* Step 1: Install */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-200">
                1. Install the CLI
              </span>
              <div className="flex space-x-1 rounded-md bg-zinc-800 p-0.5">
                {(["npm", "pnpm", "yarn"] as const).map((pm) => (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => setPackageManager(pm)}
                    className={cn(
                      "rounded px-2 py-0.5 text-xs font-medium transition-colors",
                      packageManager === pm
                        ? "bg-zinc-700 text-white"
                        : "text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    {pm}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between rounded bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-300">
              <code>{installCommands[packageManager]}</code>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(installCommands[packageManager], 1)
                }
                className="ml-2 text-zinc-400 transition-colors hover:text-white"
                title="Copy command"
              >
                {copiedIndex === 1 ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Step 2: Login */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-200">
                2. Authenticate
              </span>
              <span className="text-xs text-zinc-500">
                Requires API key from profile
              </span>
            </div>
            <div className="flex items-center justify-between rounded bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-300">
              <code>abby login</code>
              <button
                type="button"
                onClick={() => copyToClipboard("abby login", 2)}
                className="ml-2 text-zinc-400 transition-colors hover:text-white"
                title="Copy command"
              >
                {copiedIndex === 2 ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Step 3: Initialize */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-200">
                3. Initialize configuration
              </span>
              <span className="text-xs text-zinc-500">
                Creates abby.config.ts
              </span>
            </div>
            <div className="flex items-center justify-between rounded bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-300">
              <code>abby init</code>
              <button
                type="button"
                onClick={() => copyToClipboard("abby init", 3)}
                className="ml-2 text-zinc-400 transition-colors hover:text-white"
                title="Copy command"
              >
                {copiedIndex === 3 ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Step 4: Push */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-zinc-200">
                4. Synchronize changes
              </span>
              <span className="text-xs text-zinc-500">
                Pushes flags & tests to Abby
              </span>
            </div>
            <div className="flex items-center justify-between rounded bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-300">
              <code>abby push</code>
              <button
                type="button"
                onClick={() => copyToClipboard("abby push", 4)}
                className="ml-2 text-zinc-400 transition-colors hover:text-white"
                title="Copy command"
              >
                {copiedIndex === 4 ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-4 text-sm text-zinc-400">
          <a
            href="https://docs.tryabby.com/reference/cli"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-pink-400 transition-colors hover:text-pink-300"
          >
            Read CLI Documentation
            <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
          </a>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
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
        onPointerDown={() => {
          trackEvent("Dashboard Code Clicked");
        }}
      >
        <Button size="icon" variant="secondary" title="CLI & Project Details">
          <BsCodeSlash size={20} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end">
        <DropdownMenuItem onClick={onCopyProjectId}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Project ID
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setIsOpen(true)}>
          <Terminal className="mr-2 h-4 w-4" />
          CLI Instructions
        </DropdownMenuItem>
      </DropdownMenuContent>
      <CliInstructionsModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </DropdownMenu>
  );
}
