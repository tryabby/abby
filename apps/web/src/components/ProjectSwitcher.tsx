"use client";

import {
  CaretSortIcon,
  CheckIcon,
  PlusCircledIcon,
} from "@radix-ui/react-icons";
import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "components/ui/avatar";
import { Button } from "components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "components/ui/dialog";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover";
import { useProjectId } from "lib/hooks/useProjectId";
import { cn } from "lib/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { trpc } from "utils/trpc";

type PopoverTriggerProps = React.ComponentPropsWithoutRef<
  typeof PopoverTrigger
>;

interface ProjectSwitcherProps extends PopoverTriggerProps {}

export default function ProjectSwitcher({ className }: ProjectSwitcherProps) {
  const currentProjectId = useProjectId();
  const [projectName, setProjectName] = React.useState("");
  const { data: projects } = trpc.user.getProjects.useQuery();
  const trpcContext = trpc.useContext();

  const currentProject = projects?.projects.find(
    ({ project }) => project.id === currentProjectId
  );

  const createProject = trpc.project.createProject.useMutation({
    onSuccess: () => {
      trpcContext.user.getProjects.invalidate();
    },
  });

  const { update: sessionUpdate, data } = useSession();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [showNewProjectDialog, setShowNewProjectDialog] = React.useState(false);

  const onCreateProject = async () => {
    if (!projectName) return;
    const newProject = await createProject.mutateAsync({ projectName });
    await sessionUpdate({
      lastOpenProjectId: newProject.id,
      projectIds: (data?.user?.projectIds ?? []).concat(newProject.id),
    });
    setShowNewProjectDialog(false);
    router.push({
      ...router,
      query: { ...router.query, projectId: newProject.id },
    });
  };

  return (
    <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select a team"
            className={cn("w-[200px] justify-between", className)}
          >
            <Avatar className="mr-2 h-5 w-5">
              <AvatarImage
                src={`https://avatar.vercel.sh/${currentProject?.project.id}.png`}
                alt={currentProject?.project.name}
              />
              <AvatarFallback>SC</AvatarFallback>
            </Avatar>
            <p className="truncate">{currentProject?.project.name}</p>
            <CaretSortIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandList>
              <CommandInput
                placeholder="Search team..."
                className="border-transparent focus:border-transparent focus:outline-none focus:ring-0"
              />
              <CommandEmpty>No team found.</CommandEmpty>

              {projects?.projects.map(({ project }) => (
                <CommandItem
                  key={project.id}
                  onSelect={async () => {
                    if (project.id === currentProjectId) return;

                    await sessionUpdate({
                      lastOpenProjectId: project.id,
                    });

                    router.push({
                      ...router,
                      query: { ...router.query, projectId: project.id },
                    });
                    setOpen(false);
                  }}
                  className="text-sm"
                >
                  <Avatar className="mr-2 h-5 w-5">
                    <AvatarImage
                      src={`https://avatar.vercel.sh/${project.id}.png`}
                      alt={project.name}
                      className="grayscale"
                    />
                    <AvatarFallback>SC</AvatarFallback>
                  </Avatar>
                  {project.name}
                  <CheckIcon
                    className={cn(
                      "ml-auto h-4 w-4",
                      currentProject?.project.id === project.id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandList>
            <CommandSeparator />
            <CommandList>
              <CommandGroup>
                <DialogTrigger asChild>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      setShowNewProjectDialog(true);
                    }}
                  >
                    <PlusCircledIcon className="mr-2 h-5 w-5" />
                    Create Project
                  </CommandItem>
                </DialogTrigger>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Add a new project to your account.
          </DialogDescription>
        </DialogHeader>
        <div>
          <div className="space-y-4 py-2 pb-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project name</Label>
              <Input
                id="name"
                placeholder="Acme Inc."
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setShowNewProjectDialog(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!projectName}
            onClick={onCreateProject}
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
