import { TRPCClientError } from "@trpc/client";
import { TRPC_ERROR_CODES_BY_KEY } from "@trpc/server/rpc";
import { Modal } from "components/Modal";
import { Card, CardContent } from "components/ui/card";
import { useTracking } from "lib/tracking";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { trpc } from "utils/trpc";
import {
  CreateTestSection,
  DEFAULT_NEW_VARIANT_PREFIX,
} from "./Test/CreateTestSection";

type UIVariant = { name: string; weight: number; id: string };

const INITIAL_VARIANTS: Array<UIVariant> = [
  {
    name: `${DEFAULT_NEW_VARIANT_PREFIX}1`,
    id: crypto.randomUUID(),
  },
  {
    name: `${DEFAULT_NEW_VARIANT_PREFIX}2`,
    id: crypto.randomUUID(),
  },
].map((v, _, array) => {
  const weight = Number((100 / array.length).toFixed(2));
  return { ...v, weight };
});

const INITIAL_TEST_NAME = "New Test";

type Props = {
  onClose: () => void;
  isOpen: boolean;
  projectId: string;
};

export const AddABTestModal = ({ onClose, isOpen, projectId }: Props) => {
  const [testName, setTestName] = useState(INITIAL_TEST_NAME);
  const [variants, setVariants] = useState<Array<UIVariant>>(INITIAL_VARIANTS);

  const variantsIncludeDuplicates =
    new Set(variants.map((variant) => variant.name)).size !== variants.length;

  const variantsWeightSum = Number(
    variants
      .map(({ weight }) => weight)
      .reduce((sum, weight) => sum + weight, 0)
      .toFixed(2)
  );

  const isConfirmButtonDisabled =
    variantsIncludeDuplicates || Math.abs(variantsWeightSum - 100) > 0.3;

  const createTestMutation = trpc.tests.createTest.useMutation();
  const trpcContext = trpc.useContext();
  const trackEvent = useTracking();

  const onCreateClick = async () => {
    try {
      if (!variants.length || !variants[0]) throw new Error();

      if (Math.abs(variantsWeightSum - 100) > 0.3) {
        toast.error("Weights must add up to 100%");
        return;
      }

      await createTestMutation.mutateAsync({
        name: testName,
        variants: variants.map((v) => ({
          name: v.name,
          weight: Number.parseFloat((v.weight / 100).toFixed(3)), // Convert to decimal with proper precision
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
      <Card>
        <CardContent className="pt-6">
          <CreateTestSection
            setTestName={setTestName}
            setVariants={setVariants}
            testName={testName}
            variants={variants}
          />
        </CardContent>
      </Card>
    </Modal>
  );
};
