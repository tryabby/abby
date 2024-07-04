import { Event, Test } from "@prisma/client";
import { ReactNode, useId, useState } from "react";
import { AbbyEventType } from "@tryabby/core";
import { Serves } from "./Serves";
import { Metrics } from "./Metrics";
import Weights from "./Weights";
import type { ClientOption } from "server/trpc/router/project";
import { BiInfoCircle } from "react-icons/bi";
import * as Popover from "@radix-ui/react-popover";
import { AiOutlineDelete } from "react-icons/ai";
import { trpc } from "utils/trpc";
import { toast } from "react-hot-toast";
import { Button } from "components/ui/button";
import Link from "next/link";
import { useRouter } from "next/router";
import { useFeatureFlag } from "lib/abby";
import { TitleEdit } from "components/TitleEdit";
import { Modal } from "components/Modal";
import { cn } from "lib/utils";

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

export const Card = ({
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
    <div
      className={cn(
        "my-4 flex flex-col rounded-md bg-card p-4 shadow-lg",
        className
      )}
    >
      <div className="flex justify-between text-primary">
        <h4 className="mb-2 font-bold">{title}</h4>
        {tooltip && (
          <Popover.Root>
            <Popover.Trigger asChild>
              <button>
                <BiInfoCircle />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                className="max-w-sm select-none rounded-[4px] bg-accent px-[15px] py-[10px] text-[15px] leading-none text-pink-50 shadow-md will-change-[transform,opacity] data-[state=delayed-open]:data-[side=bottom]:animate-slideUpAndFade data-[state=delayed-open]:data-[side=left]:animate-slideRightAndFade data-[state=delayed-open]:data-[side=right]:animate-slideLeftAndFade data-[state=delayed-open]:data-[side=top]:animate-slideDownAndFade"
                sideOffset={5}
              >
                {tooltip}
                <Popover.Arrow className="fill-gray-800" />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        )}
      </div>
      {children}
    </div>
  );
};

const Section = ({
  name,
  options = [],
  events = [],
  id,
}: Test & {
  options: ClientOption[];
  events: Event[];
}) => {
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const trpcContext = trpc.useContext();
  const showAdvancedTestStats = useFeatureFlag("AdvancedTestStats");

  const bestVariant = getBestVariant({
    absPings: events.filter((event) => event.type === AbbyEventType.ACT).length,
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
    <section className="w-full rounded-lg bg-secondary p-4">
      <div className="flex justify-between px-2">
        <TitleEdit
          title={name}
          onSave={(newName) => updateTestName({ name: newName, testId: id })}
        />
        <Button
          title="Delete Test"
          onClick={() => {
            setIsDeleteModalOpen(true);
          }}
          size="icon"
          variant="destructive"
        >
          <AiOutlineDelete />
        </Button>
        <DeleteTestModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          testId={id}
          testName={name}
        />
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <Card
          title="Weight"
          tooltip={
            <p>
              The weights define the chances for your defined variants to be
              served. <br />
              This means that if you have 2 variants with a weight of 50%, each
              variant will be served 50% of the time.
            </p>
          }
        >
          <Weights options={options} />
        </Card>
        <Card
          title="Visits"
          tooltip={
            <p>
              A visit means that a user has visited a page where the A/B test
              takes place. Think of it like a page visit on a website.
            </p>
          }
        >
          <Serves
            options={options}
            pingEvents={events.filter(
              (event) => event.type === AbbyEventType.PING
            )}
          />
        </Card>
        <Card
          title="Interactions"
          tooltip={
            <p>
              An interaction is triggered when the
              <code className="mx-1 rounded-md bg-gray-600 px-1 py-0.5">
                onAct
              </code>
              is called in your code.
            </p>
          }
        >
          <Metrics
            options={options}
            pingEvents={events.filter(
              (event) => event.type === AbbyEventType.ACT
            )}
          />
        </Card>
      </div>
      <div className="mt-3 flex">
        {bestVariant && (
          <p className="text-pink-50">
            The variant <b>{bestVariant}</b> is currently performing best
          </p>
        )}
        {showAdvancedTestStats && (
          <Link
            href={`/projects/${router.query.projectId}/tests/${id}`}
            className="contents"
          >
            <Button className="ml-auto">See More</Button>
          </Link>
        )}
      </div>
    </section>
  );
};

export default Section;
