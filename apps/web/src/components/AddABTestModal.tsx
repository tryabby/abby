import { TRPCClientError } from "@trpc/client";
import { TRPC_ERROR_CODES_BY_KEY } from "@trpc/server/rpc";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { PlausibleEvents } from "types/plausible-events";
import { trpc } from "utils/trpc";
import { Modal } from "./Modal";
import {
  CreateTestSection,
  DEFAULT_NEW_VARIANT_PREFIX,
} from "./Test/CreateTestSection";
import { useTracking } from "lib/tracking";

type UIVariant = { name: string; weight: number };

const INITIAL_VARIANTS: Array<UIVariant> = [
  {
    name: `${DEFAULT_NEW_VARIANT_PREFIX}1`,
  },
  {
    name: `${DEFAULT_NEW_VARIANT_PREFIX}2`,
  },
  // give each variant a weight of 100 / number of variants
].map((v, _, array) => ({ ...v, weight: 100 / array.length }));

const INITIAL_TEST_NAME = "New Test";

type Props = {
  onClose: () => void;
  isOpen: boolean;
  projectId: string;
};

export const AddABTestModal = ({ onClose, isOpen, projectId }: Props) => {
  const [testName, setTestName] = useState(INITIAL_TEST_NAME);
  const [variants, setVariants] =
    useState<Array<{ name: string; weight: number }>>(INITIAL_VARIANTS);

  const variantsIncludeDuplicates =
    new Set(variants.map((variant) => variant.name)).size !== variants.length;

  const variantsWeightSum = variants
    .map(({ weight }) => weight)
    .reduce((sum, weight) => (sum += weight), 0);

  const isConfirmButtonDisabled =
    variantsIncludeDuplicates || variantsWeightSum !== 100;

  const createTestMutation = trpc.tests.createTest.useMutation();

  const trpcContext = trpc.useContext();

  const trackEvent = useTracking();

  const onCreateClick = async () => {
    try {
      if (!variants.length || !variants[0]) throw new Error();

      if (variants.reduce((acc, curr) => acc + curr.weight, 0) !== 100) {
        toast.error("Weights must add up to 100");
        return;
      }

      await createTestMutation.mutateAsync({
        name: testName,
        variants: variants.map((v) => ({
          name: v.name,
          weight: v.weight / 100,
        })),
        projectId: projectId,
      });

      trpcContext.project.getProjectData.invalidate({
        projectId: projectId,
      });

      setTestName(INITIAL_TEST_NAME);
      setVariants(INITIAL_VARIANTS);

      onClose();
      trackEvent("AB-Test Created", {
        props: { "Amount Of Variants": variants.length },
      });
      toast.success("Test created");
    } catch (e) {
      toast.error(
        e instanceof TRPCClientError &&
          e.shape.code === TRPC_ERROR_CODES_BY_KEY.FORBIDDEN
          ? e.message
          : "Could not create test"
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create new A/B Test"
      confirmText="Create"
      onConfirm={onCreateClick}
      size="full"
      isConfirming={createTestMutation.isLoading}
      isConfirmButtonDisabled={isConfirmButtonDisabled}
    >
      <CreateTestSection
        setTestName={setTestName}
        setVariants={setVariants}
        testName={testName}
        variants={variants}
      />
    </Modal>
  );
};
