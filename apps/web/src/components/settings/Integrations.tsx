import { Label } from "@radix-ui/react-label";
import { LoadingSpinner } from "components/LoadingSpinner";
import { Button } from "components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover";
import { cn } from "lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { match } from "ts-pattern";
import { trpc } from "utils/trpc";

export function Integrations({ projectId }: { projectId: string | undefined }) {
  const [open, setOpen] = useState(false);
  const [selectedRepositoryId, setSelectedRepositoryId] = useState<string>();
  const integrationsQuery = trpc.project.getIntegrations.useQuery(
    // biome-ignore lint/style/noNonNullAssertion: we check for enabled
    { projectId: projectId! },
    { enabled: !!projectId }
  );

  const updateGithubIntegration =
    trpc.project.updateGithubIntegration.useMutation({
      onSuccess: () => {
        integrationsQuery.refetch();
      },
    });

  if (integrationsQuery.isLoading) return <LoadingSpinner />;
  if (integrationsQuery.error) return <div>Error</div>;
  if (integrationsQuery.data.length === 0) {
    return (
      <div>
        <h1>No integrations</h1>
      </div>
    );
  }

  return integrationsQuery.data.map((i) =>
    match(i.type)
      .with("GITHUB", () => {
        const selectedRepository = i.potentialRepositories.find(
          (r) => r.id.toString() === selectedRepositoryId
        );

        return (
          <Card key={i.id} className="max-w-lg">
            <CardHeader>
              <CardTitle>Github</CardTitle>
              <CardDescription>
                The selected repository will be used to automagically create and
                update pull requests for your feature flags.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {i.installedRepos.length === 0 ? (
                <div className="flex flex-col space-y-3">
                  <div className="grid gap-x-1.5">
                    <Label>Selected Repository</Label>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="w-[350px] justify-between"
                        >
                          {selectedRepository ? (
                            <span>
                              <span className="text-muted-foreground">
                                {selectedRepository.owner}/
                              </span>
                              {selectedRepository.name}
                            </span>
                          ) : (
                            "Select framework..."
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[350px] p-0">
                        <Command>
                          <CommandInput placeholder="Search repository..." />
                          <CommandList>
                            <CommandEmpty>No framework found.</CommandEmpty>
                            <CommandGroup>
                              {i.potentialRepositories.map((repo) => (
                                <CommandItem
                                  key={repo.id}
                                  value={`${repo.owner}/${repo.name}`}
                                  onSelect={() => {
                                    setSelectedRepositoryId(
                                      repo.id.toString() ===
                                        selectedRepositoryId
                                        ? undefined
                                        : repo.id.toString()
                                    );
                                    setOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedRepositoryId ===
                                        repo.id.toString()
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <span>
                                    <span className="text-muted-foreground">
                                      {repo.owner}/
                                    </span>
                                    {repo.name}
                                  </span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Button
                    className="ml-auto"
                    onClick={async () => {
                      if (!selectedRepositoryId) return;
                      await updateGithubIntegration.mutateAsync({
                        integrationId: i.id,
                        repositoryId: Number(selectedRepositoryId),
                      });
                    }}
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col space-y-3">
                  <span>Your selected repository is</span>

                  <Link
                    href={`https://github.com/${i.installedRepos[0]?.owner}/${i.installedRepos[0]?.name}`}
                    className="bg-primary-foreground mr-auto p-2 rounded-md font-mono"
                  >
                    <span className="text-muted-foreground">
                      {i.installedRepos[0]?.owner}/
                    </span>
                    {i.installedRepos[0]?.name}
                  </Link>

                  <small>Need to change this? Contact us</small>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })
      .exhaustive()
  );
}
