import produce from "immer";
import { getUpdatedWeights } from "lib/helper";
import { ChangeEvent, Dispatch, Fragment, SetStateAction } from "react";
import { BiTrash } from "react-icons/bi";
import { Card } from "./Section";

type Props = {
  testName: string;
  setTestName: (name: string) => void;
  variants: Array<{ name: string; weight: number }>;
  setVariants: Dispatch<
    SetStateAction<
      {
        name: string;
        weight: number;
      }[]
    >
  >;
};

export const DEFAULT_NEW_VARIANT_PREFIX = "New Variant ";

/**
 * Searches through a list of variants, that start with the default variant name,
 * and determines the currently largest number behind the prefix
 *
 * @example
 * ["New Variant 4", "New Variant 1", "Other Variant 5"] -> 4
 */
function getMaxDefaultVariantNameIndex(variants: Props["variants"]): number {
  const variantsIndexes = variants
    .filter((variant) => variant.name.startsWith(DEFAULT_NEW_VARIANT_PREFIX))
    .map((defaultVariant) => {
      const index = /[0-9]+/.exec(defaultVariant.name)?.[0];

      if (!index) {
        return 0;
      }

      return parseInt(index);
    });

  if (variantsIndexes.length === 0) {
    return 0;
  }

  return Math.max(...variantsIndexes);
}

export function CreateTestSection({
  setTestName,
  testName,
  setVariants,
  variants,
}: Props) {
  const updateWeights = (draft: { name: string; weight: number }[]) => {
    if (draft.length <= 2) {
      draft.forEach((draftItem) => {
        draftItem.weight = 100 / draft.length;
      });
    }
  };

  const addVariant = () => {
    const maxVariantIndex = getMaxDefaultVariantNameIndex(variants);

    setVariants(
      produce(variants, (draft) => {
        draft.push({
          name: `${DEFAULT_NEW_VARIANT_PREFIX}${maxVariantIndex + 1}`,
          weight: 0,
        });
        updateWeights(draft);
      })
    );
  };

  const removeVariant = (index: number) => {
    // delete and rebalance weights
    setVariants(
      produce(variants, (draft) => {
        draft.splice(index, 1);
        updateWeights(draft);
      })
    );
  };

  const weightSum = variants
    .map(({ weight }) => weight)
    .reduce((sum, weight) => (sum += weight), 0);

  const handleWeightChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const rawEventValue = event.target.value !== "" ? event.target.value : 0;

    const eventValue =
      typeof rawEventValue === "number"
        ? rawEventValue
        : parseInt(rawEventValue);

    if (isNaN(eventValue)) {
      return;
    }

    setVariants((currentVariants) => {
      const updatedWeights = getUpdatedWeights({
        indexToUpdate: index,
        newWeight: eventValue,
        weights: variants.map((v) => v.weight),
      });

      return currentVariants.map((currentVariant, i) => ({
        name: currentVariant.name,
        weight: updatedWeights[i] ?? 0,
      }));
    });
  };

  return (
    <section className="flex w-full flex-col text-white">
      <h2 className="h-8 font-bold text-pink-200">{testName}</h2>
      <div className="grid grid-cols-1">
        <Card title="Settings" className="bg-gray-800/60">
          <form className="mr-auto flex flex-col space-y-4">
            <label>Name:</label>
            <input
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              className="flex items-center space-x-4 rounded-md bg-gray-700 p-2 pr-4 focus:outline focus:outline-blue-400"
            />
          </form>
        </Card>
        <Card title="Variants" className="bg-gray-800/60">
          <div className="flex flex-col gap-4">
            {variants.map(({ name, weight }, i) => {
              return (
                <Fragment key={i}>
                  <label
                    htmlFor={name}
                    className="mb-0 mt-2 grid grid-cols-3 grid-rows-[auto_auto] items-center text-sm font-medium text-pink-100 dark:text-white"
                  >
                    <input
                      className="w-fit space-x-4 rounded-md bg-gray-700 p-2 pr-4 focus:outline focus:outline-blue-400"
                      placeholder="New Variant"
                      value={name}
                      onChange={(e) => {
                        setVariants(
                          produce(variants, (draft) => {
                            if (draft[i]) {
                              draft[i]!.name = e.target.value;
                            }
                          })
                        );
                      }}
                    />
                    <span className="relative block w-[7ch] justify-self-center">
                      <input
                        className="w-full rounded-md bg-gray-700 py-2 pr-6 text-right focus:outline focus:outline-blue-400"
                        value={weight}
                        onChange={(e) => handleWeightChange(i, e)}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                        %
                      </span>
                    </span>
                    <button
                      className="flex aspect-square h-full items-center justify-center justify-self-end rounded-md bg-gray-700 transition-colors duration-200 ease-in-out hover:bg-red-700/40"
                      title="Delete this Variant"
                      onClick={() => removeVariant(i)}
                    >
                      <BiTrash />
                    </button>

                    {variants.filter((variant) => variant.name === name)
                      .length > 1 && (
                      <p className="mt-1 pl-2 text-xs text-accent-background">
                        A variant with this name already exists
                      </p>
                    )}
                  </label>
                  <input
                    id={name}
                    type="range"
                    min="0"
                    max="100"
                    value={weight}
                    onChange={(e) => handleWeightChange(i, e)}
                    className="h-2 w-full cursor-pointer"
                  ></input>
                </Fragment>
              );
            })}
            <div className="grid grid-cols-[1fr_auto_1fr]">
              <span></span>
              {weightSum !== 100 ? (
                <p className="text-center text-accent-background">
                  Your weights must add up to 100%. Your weights currently make
                  up {weightSum}%
                </p>
              ) : (
                <span></span>
              )}
              <button
                type="button"
                onClick={addVariant}
                className="w-fit self-end justify-self-end rounded-sm bg-blue-300 px-3 py-0.5 text-gray-800 transition-colors duration-200 ease-in-out hover:bg-blue-400"
              >
                Add Variant
              </button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
