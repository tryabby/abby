import { Button } from "components/ui/button";
import { Card, CardContent, CardHeader } from "components/ui/card";
import { Input } from "components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "components/ui/tooltip";
import produce from "immer";
import { cn } from "lib/utils";
import { RotateCcw } from "lucide-react";
import { PieChart, Plus, Trash2 } from "lucide-react";
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";

type Props = {
  testName: string;
  setTestName: (name: string) => void;
  variants: Array<{ name: string; weight: number; id: string }>;
  setVariants: Dispatch<
    SetStateAction<
      {
        name: string;
        weight: number;
        id: string;
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

      return Number.parseInt(index);
    });

  if (variantsIndexes.length === 0) {
    return 0;
  }

  return Math.max(...variantsIndexes);
}

const WeightPresets = {
  "Equal Split": (count: number) => {
    if (count === 3) {
      return [33.3, 33.3, 33.3];
    }
    const weight = Number((100 / count).toFixed(2));
    const weights = Array(count).fill(0);

    // Distribute weights evenly and handle remainder
    let remaining = 100;
    for (let i = 0; i < count - 1; i++) {
      weights[i] = weight;
      remaining -= weight;
    }
    weights[count - 1] = Number(remaining.toFixed(2));

    return weights;
  },
  "Champion/Challenger": (count: number) => {
    if (count < 2) return [100];
    const challenger = 10;
    const remaining = Number((90 / (count - 1)).toFixed(2));

    // Handle remainder to ensure 100% total
    const weights = Array(count).fill(remaining);
    weights[count - 1] = challenger;

    // Adjust last non-challenger weight to make sum exactly 100
    const sum = weights.reduce((a, b) => a + b, 0);
    if (sum !== 100) {
      weights[count - 2] = Number(
        (weights[count - 2] + (100 - sum)).toFixed(2)
      );
    }

    return weights;
  },
  "Progressive Split": (count: number) => {
    if (count < 2) return [100];
    const total = (count * (count + 1)) / 2;
    const weights = Array(count)
      .fill(0)
      .map((_, i) => Number((((i + 1) * 100) / total).toFixed(2)));

    // Handle rounding by adjusting last weight
    const sum = weights.reduce((a, b) => a + b, 0);
    if (sum !== 100) {
      weights[count - 1] = Number(
        ((weights[count - 1] ?? 0) + (100 - sum)).toFixed(2)
      );
    }

    return weights;
  },
};

// Distribution color palette using tailwind colors that work well in both modes
const WEIGHT_COLORS = [
  "bg-blue-500/90 dark:bg-blue-400/90",
  "bg-emerald-500/90 dark:bg-emerald-400/90",
  "bg-indigo-500/90 dark:bg-indigo-400/90",
  "bg-amber-500/90 dark:bg-amber-400/90",
  "bg-rose-500/90 dark:bg-rose-400/90",
];

const PRESET_DESCRIPTIONS = {
  "Equal Split": {
    description: "Distributes traffic evenly between all variants",
    example: "e.g., 33.3% / 33.3% / 33.3%",
  },
  "Champion/Challenger": {
    description: "90% to existing variant, 10% to the new variant",
    example: "e.g., 45% / 45% / 10%",
  },
  "Progressive Split": {
    description: "Gradually increases weight for each variant",
    example: "e.g., 17% / 33% / 50%",
  },
};

export function CreateTestSection({
  setTestName,
  testName,
  setVariants,
  variants,
}: Props) {
  const [selectedPreset, setSelectedPreset] = useState<
    keyof typeof WeightPresets | undefined
  >(undefined);
  const [isDirty, setIsDirty] = useState(false);
  const [showError, setShowError] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateWeights = (weights: number[]) => {
    setVariants((current) =>
      current.map((variant, i) => ({
        ...variant,
        weight: Number(weights[i]?.toFixed(2)),
      }))
    );
    setIsDirty(true);
  };

  const addVariant = () => {
    const maxVariantIndex = getMaxDefaultVariantNameIndex(variants);
    setVariants(
      produce(variants, (draft) => {
        draft.push({
          id: crypto.randomUUID(),
          name: `${DEFAULT_NEW_VARIANT_PREFIX}${maxVariantIndex + 1}`,
          weight: 1,
        });
      })
    );
    setIsDirty(true);
  };

  const removeVariant = (index: number) => {
    setVariants(
      produce(variants, (draft) => {
        draft.splice(index, 1);
        // Rebalance weights after removing
        const equalWeight = Number((100 / draft.length).toFixed(2));
        const remainder = Number(
          (100 - equalWeight * (draft.length - 1)).toFixed(2)
        );
        draft.forEach((v, i) => {
          v.weight = i === draft.length - 1 ? remainder : equalWeight;
        });
      })
    );
    setIsDirty(true);
  };

  const handleWeightChange = (index: number, value: string) => {
    setVariants(
      produce(variants, (draft) => {
        if (!draft[index]) return;
        draft[index].weight = Number.parseFloat(
          Number.parseFloat(value).toFixed(2)
        );
      })
    );
    setIsDirty(true);
  };

  const weightSum = Number(
    variants.reduce((sum, { weight }) => sum + weight, 0).toFixed(2)
  );
  const isValidWeightSum = Math.abs(weightSum - 100) <= 0.1;

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowError(!isValidWeightSum);
    }, 500);

    return () => clearTimeout(timer);
  }, [isValidWeightSum]);

  const applyPreset = (preset: keyof typeof WeightPresets) => {
    const weights = WeightPresets[preset](variants.length);
    updateWeights(weights);
    setSelectedPreset(preset);
  };

  const onRevert = () => {
    setVariants(variants);
    setTestName(testName);
    setSelectedPreset(undefined);
    setIsDirty(false);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTestName(e.target.value);
    setIsDirty(true);
  };

  const handleVariantNameChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    setVariants(
      produce(variants, (draft) => {
        if (!draft[index]) return;
        draft[index].name = e.target.value;
      })
    );
    setIsDirty(true);
  };

  return (
    <section ref={containerRef} className="flex flex-col w-full space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Settings</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label htmlFor="testName" className="text-sm font-medium">
                Test Name:
              </label>
              <Input
                id="testName"
                value={testName}
                onChange={handleNameChange}
                className="mt-1.5"
                placeholder="My A/B Test"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Variants</h2>
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Select
                      value={selectedPreset}
                      onValueChange={(value) =>
                        applyPreset(value as keyof typeof WeightPresets)
                      }
                    >
                      <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Choose distribution..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(WeightPresets).map((preset) => (
                          <SelectItem
                            key={preset}
                            value={preset}
                            className="flex items-center"
                          >
                            <div className="flex items-center gap-2">
                              <PieChart className="w-4 h-4 text-muted-foreground" />
                              <div className="flex flex-col">
                                <span>{preset}</span>
                                <span className="text-xs text-muted-foreground">
                                  {
                                    PRESET_DESCRIPTIONS[
                                      preset as keyof typeof PRESET_DESCRIPTIONS
                                    ].example
                                  }
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TooltipTrigger>
                  <TooltipContent>
                    {selectedPreset
                      ? PRESET_DESCRIPTIONS[
                          selectedPreset as keyof typeof PRESET_DESCRIPTIONS
                        ].description
                      : "Choose a preset weight distribution"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {variants.map(({ name, weight, id }, i) => (
              <div
                key={id}
                className={cn(
                  "grid grid-cols-[1fr_120px_40px] items-center gap-4",
                  focusedIndex === i ? "relative" : ""
                )}
              >
                <Input
                  value={name}
                  onChange={(e) => handleVariantNameChange(e, i)}
                  onFocus={() => setFocusedIndex(i)}
                  onBlur={() => setFocusedIndex(null)}
                  placeholder="Variant name"
                  className={cn(
                    "transition-shadow duration-200",
                    focusedIndex === i
                      ? "ring-2 ring-primary ring-offset-2"
                      : ""
                  )}
                />
                <div className="relative">
                  <Input
                    value={weight}
                    onChange={(e) => handleWeightChange(i, e.target.value)}
                    onFocus={() => setFocusedIndex(i)}
                    onBlur={() => {
                      setFocusedIndex(null);
                    }}
                    inputMode="decimal"
                    className={cn(
                      "pr-14 transition-shadow duration-200", // Increased padding for keyboard hints
                      focusedIndex === i
                        ? "ring-2 ring-primary ring-offset-2"
                        : ""
                    )}
                    type="number"
                    min={1}
                    max={100}
                    step={1}
                    data-index={i}
                  />
                  <div
                    className={cn(
                      "absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-200 flex items-center gap-1",
                      focusedIndex === i
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    <span>%</span>
                  </div>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-10 w-10 transition-colors duration-200",
                          focusedIndex === i
                            ? "hover:bg-destructive hover:text-destructive-foreground"
                            : "hover:bg-destructive/10 hover:text-destructive"
                        )}
                        disabled={variants.length <= 2}
                        onClick={() => removeVariant(i)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">Remove variant</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ))}

            <div className="relative">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/50 mt-4">
                {variants.map((option, i) => {
                  return (
                    <div
                      key={option.id}
                      className={cn(
                        "h-full float-left transition-all duration-500 ease-in-out cursor-pointer group relative",
                        WEIGHT_COLORS[i % WEIGHT_COLORS.length],
                        focusedIndex === i
                          ? "ring-2 ring-primary ring-offset-2"
                          : ""
                      )}
                      style={{
                        width: `${option.weight}%`,
                      }}
                      title={`${option.name}: ${option.weight.toFixed(2)}%`}
                    />
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-sm">
                {showError && (
                  <p className="text-red-400">
                    Weights must add up to 100% (currently{" "}
                    {weightSum.toFixed(2)}%)
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isDirty && (
                  <Button
                    onClick={onRevert}
                    variant="ghost"
                    size="sm"
                    className="hover:bg-muted"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                )}

                <Button
                  onClick={addVariant}
                  disabled={variants.length >= 5}
                  variant="outline"
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Variant
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="sr-only" aria-live="polite">
        {isDirty &&
          `Changes pending. ${variants.length} variants with total weight: ${weightSum.toFixed(2)}%`}
      </div>
    </section>
  );
}
