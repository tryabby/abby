import { Option } from "@prisma/client";
import { Button } from "components/Button";
import { getUpdatedWeights } from "lib/helper";
import { useRouter } from "next/router";
import { ChangeEvent, ChangeEventHandler, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import type { ClientOption } from "server/trpc/router/project";
import { trpc } from "utils/trpc";

const Weight = ({
  option,
  value,
  index,
  onChange,
}: {
  option: ClientOption;
  value: number;
  index: number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
    <>
      <label
        htmlFor={option.id}
        className="mb-0 mt-2 flex justify-between text-sm font-medium text-pink-100 dark:text-white"
      >
        <span>{option.identifier}</span>
        <span>{Math.round(value)}%</span>
      </label>
      <input
        id={option.id}
        type="range"
        min="0"
        max="100"
        value={value}
        className="h-2 w-full cursor-pointer"
        onChange={onChange}
      ></input>
    </>
  );
};

const Weights = ({ options }: { options: ClientOption[] }) => {
  const router = useRouter();
  const trpcContext = trpc.useContext();
  const [weights, setWeights] = useState(
    options.map((option) => parseFloat(option.chance.toString()) * 100)
  );

  const { mutateAsync } = trpc.tests.updateWeights.useMutation();

  const updateWeight = (indexToUpdate: number, newWeight: number) => {
    setWeights((currentWeights) =>
      getUpdatedWeights({
        indexToUpdate,
        newWeight,
        weights: currentWeights,
      })
    );
  };

  const weightsSum = weights.reduce((sum, curr) => (sum += curr), 0);

  const onSave = async () => {
    try {
      if (!options.length || !options[0]) throw new Error();

      await mutateAsync({
        testId: options[0].testId,
        weights: weights.map((weight, index) => ({
          variantId: options[index]!.id,
          weight: weight / 100,
        })),
      });

      await trpcContext.project.getProjectData.invalidate({
        projectId: router.query.projectId as string,
      });

      toast.success("Weights saved");
    } catch (e) {
      console.error(e);
      toast.error("Could not update weights");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {options.map((option, index) => (
        <Weight
          key={option.id}
          value={weights[index] || 0}
          index={index}
          onChange={(e) => updateWeight(index, parseInt(e.target.value, 10))}
          option={option}
        />
      ))}
      <div className="flex justify-between">
        {weightsSum !== 100 ? (
          <p className="text-center text-xs text-accent-background">
            Your weights must add up to 100%. Your weights currently make up{" "}
            {weightsSum}%
          </p>
        ) : (
          <span></span>
        )}
        <Button onClick={onSave} disabled={weightsSum !== 100}>
          Save
        </Button>
      </div>
    </div>
  );
};

export default Weights;
