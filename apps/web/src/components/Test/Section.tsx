import type { Test } from "@prisma/client";
import * as Popover from "@radix-ui/react-popover";
import { Modal } from "components/Modal";
import { TitleEdit } from "components/TitleEdit";
import { Button } from "components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { useFeatureFlag } from "lib/abby";
import { cn } from "lib/utils";
import { ChevronRight, TrashIcon } from "lucide-react";
import { useRouter } from "next/router";
import type { ProjectClientEvents } from "pages/projects/[projectId]";
import { type ReactNode, useState } from "react";
import { toast } from "react-hot-toast";
import { BiInfoCircle } from "react-icons/bi";
import type { ClientOption } from "server/trpc/router/project";
import { trpc } from "utils/trpc";
import { Metrics } from "./Metrics";
import { Serves } from "./Serves";
import Weights from "./Weights";

function getBestVariant({
  absPings,
  options,
}: {
  absPings: number;
  options: ClientOption[];
}) {
  const bestVariant = options.reduce(
    (accumulator, option) => {
      const pings = absPings * option.chance;
      if (pings > accumulator.pings) {
        return {
          pings,
          identifier: option.identifier,
        };
      }
      return accumulator;
    },
    { pings: 0, identifier: "" }
  );

  return bestVariant;
}

const DeleteTestModal = ({
  isOpen,
  onClose,
  testId,
  testName,
}: {
  isOpen: boolean;
  onClose: () => void;
  testId: string;
  testName: string;
}) => {
  const trpcContext = trpc.useContext();
  const { mutate: deleteTest } = trpc.tests.delete.useMutation({
    onSuccess() {
      toast.success("Deleted test");
      trpcContext.project.invalidate();
      onClose();
    },
    onError() {
      toast.error("Failed to delete test");
    },
  });

  return (
    <Modal
      title="Delete Test"
      confirmText="Delete"
      onConfirm={() => deleteTest({ testId })}
      isOpen={isOpen}
      onClose={onClose}
    >
      <p>
        Are you sure that you want to delete the Test <b>{testName}</b>?
      </p>
      <p>All events associated Events to that Test will be removed</p>
    </Modal>
  );
};

export const MetricCard = ({
  title,
  children,
  tooltip,
  className,
}: {
  title: string;
  children: ReactNode;
  tooltip?: string | ReactNode;
  className?: string;
}) => {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {tooltip && (
            <Popover.Root>
              <Popover.Trigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                  <BiInfoCircle className="h-4 w-4" />
                </Button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  className="w-[260px] rounded-md bg-popover p-4 text-popover-foreground shadow-md"
                  sideOffset={5}
                >
                  {tooltip}
                  <Popover.Arrow className="fill-popover" />
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          )}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

const Section = ({
  name,
  options = [],
  actEvents,
  pingEvents,
  id,
}: Test & {
  options: ClientOption[];
  pingEvents: ProjectClientEvents;
  actEvents: ProjectClientEvents;
}) => {
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const trpcContext = trpc.useContext();
  const showAdvancedTestStats = useFeatureFlag("AdvancedTestStats");

  const bestVariant = getBestVariant({
    absPings: actEvents.length + pingEvents.length,
    options,
  }).identifier;

  const { mutate: updateTestName } = trpc.tests.updateName.useMutation({
    onSuccess() {
      toast.success("Updated name");
      trpcContext.project.invalidate();
    },
    onError() {
      toast.error("Failed to update name");
    },
  });

  return (
    <Card className="relative overflow-hidden transition-all duration-200 group/test hover:shadow-md hover:border-primary/20">
      <div className="absolute top-0 right-0 h-full w-1.5 bg-gradient-to-b from-primary/20 to-primary/5" />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <TitleEdit
            title={name}
            onSave={(newName) => updateTestName({ name: newName, testId: id })}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title="Weight Distribution"
            tooltip="The weights define the chances for your defined variants to be served. This means that if you have 2 variants with a weight of 50%, each variant will be served 50% of the time."
          >
            <Weights options={options} />
          </MetricCard>
          <MetricCard
            title="Visits"
            tooltip="A visit means that a user has visited a page where the A/B test takes place. Think of it like a page visit on a website."
          >
            <Serves options={options} pingEvents={pingEvents} />
          </MetricCard>
          <MetricCard
            title="Conversions"
            tooltip={
              <p>
                A conversion is triggered when the{" "}
                <code className="px-1 py-0.5 rounded-md bg-muted">onAct</code>{" "}
                is called in your code.
              </p>
            }
          >
            <Metrics options={options} actEvents={actEvents} />
          </MetricCard>
        </div>

        <div className="mt-4 flex items-center justify-between">
          {bestVariant && (
            <p className="text-sm text-muted-foreground">
              The variant{" "}
              <span className="font-medium text-foreground">{bestVariant}</span>{" "}
              is currently performing best
            </p>
          )}
          {showAdvancedTestStats && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() =>
                router.push(`/projects/${router.query.projectId}/tests/${id}`)
              }
            >
              View Details
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
      <DeleteTestModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        testId={id}
        testName={name}
      />
    </Card>
  );
};

export default Section;
