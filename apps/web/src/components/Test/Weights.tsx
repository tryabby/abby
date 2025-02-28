import { Button } from "components/ui/button";
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
import { cn } from "lib/utils";
import { PieChart, RotateCcw } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import type { ClientOption } from "server/trpc/router/project";
import { trpc } from "utils/trpc";

// Distribution color palette using tailwind colors that work well in both modes
const WEIGHT_COLORS = [
  "bg-blue-500/90 dark:bg-blue-400/90",
  "bg-emerald-500/90 dark:bg-emerald-400/90",
  "bg-indigo-500/90 dark:bg-indigo-400/90",
  "bg-amber-500/90 dark:bg-amber-400/90",
  "bg-rose-500/90 dark:bg-rose-400/90",
];

const WeightPresets = {
  "Equal Split": (count: number) => {
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

const PresetItem = ({
  preset,
  isSelected,
  onSelect,
}: {
  preset: string;
  isSelected: boolean;
  onSelect: () => void;
}) => (
  <SelectItem
    key={preset}
    value={preset}
    className="flex items-center"
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        onSelect();
      }
    }}
  >
    <div className="flex items-center gap-2 group">
      <PieChart
        className={cn(
          "h-4 w-4 transition-colors",
          isSelected
            ? "text-primary"
            : "text-muted-foreground group-hover:text-primary"
        )}
      />
      <div className="flex flex-col text-left">
        <span>{preset}</span>
        <span className="text-xs text-muted-foreground">
          {
            PRESET_DESCRIPTIONS[preset as keyof typeof PRESET_DESCRIPTIONS]
              .example
          }
        </span>
      </div>
    </div>
  </SelectItem>
);

const Weights = ({ options }: { options: ClientOption[] }) => {
  const router = useRouter();
  const trpcContext = trpc.useContext();
  const containerRef = useRef<HTMLDivElement>(null);

  const initialWeights = useMemo(
    () =>
      options.map((option) =>
        Number((Number.parseFloat(option.chance.toString()) * 100).toFixed(2))
      ),
    [options]
  );

  const [weights, setWeights] = useState(initialWeights);
  const [selectedPreset, setSelectedPreset] = useState<
    keyof typeof WeightPresets | undefined
  >(undefined);
  const [isDirty, setIsDirty] = useState(false);
  const [showError, setShowError] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const { mutateAsync } = trpc.tests.updateWeights.useMutation();

  const updateWeight = (indexToUpdate: number, value: string) => {
    setWeights((currentWeights) => {
      const updatedWeights = [...currentWeights];
      updatedWeights[indexToUpdate] = Number.parseFloat(
        Number.parseFloat(value).toFixed(2)
      );
      return updatedWeights;
    });
    setIsDirty(true);
  };

  const applyPreset = (preset: keyof typeof WeightPresets) => {
    const newWeights = WeightPresets[preset](options.length);
    setWeights(newWeights.map((w) => Number(w.toFixed(2))));
    setSelectedPreset(preset);
    setIsDirty(true);
  };

  const weightsSum = Number(
    weights.reduce((sum, curr) => sum + curr, 0).toFixed(2)
  );
  const isValidWeightSum = Math.abs(weightsSum - 100) <= 0.1;

  // Add debounced error display
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowError(!isValidWeightSum);
    }, 500);

    return () => clearTimeout(timer);
  }, [isValidWeightSum]);

  // Force Select UI to update when reverting
  useEffect(() => {
    if (!isDirty) {
      setSelectedPreset(undefined);
    }
  }, [isDirty]);

  const onSave = async () => {
    try {
      if (!options.length || !options[0]) throw new Error();

      await mutateAsync({
        testId: options[0].testId,
        weights: weights.flatMap((weight, index) => {
          if (!options[index]) return [];
          return {
            variantId: options[index].id,
            weight: weight / 100,
          };
        }),
      });

      await trpcContext.project.getProjectData.invalidate({
        projectId: router.query.projectId as string,
      });

      setIsDirty(false);
      toast.success("Weights saved");
    } catch (e) {
      console.error(e);
      toast.error("Could not update weights");
    }
  };

  const onRevert = () => {
    setWeights(initialWeights);
    setSelectedPreset(undefined); // Ensure preset is cleared
    setIsDirty(false);
  };

  // Add tooltip content for revert button
  const getRevertTooltipContent = () => {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">Original weights:</p>
        <div className="space-y-1">
          {options.map((option, i) => (
            <div
              key={option.id}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <span className="text-muted-foreground">
                {option.identifier}:
              </span>
              <span className="font-medium">
                {initialWeights[i]?.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (options.length === 0) {
    return (
      <div className="flex h-full min-h-[100px] items-center justify-center text-sm text-muted-foreground">
        Unfortunately, there is no data to display.
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-4">
      <div className="flex items-center mb-4">
        <Select
          value={selectedPreset}
          onValueChange={(value) =>
            applyPreset(value as keyof typeof WeightPresets)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose distribution..." />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(WeightPresets).map((preset) => (
              <PresetItem
                key={preset}
                preset={preset}
                isSelected={preset === selectedPreset}
                onSelect={() =>
                  applyPreset(preset as keyof typeof WeightPresets)
                }
              />
            ))}
          </SelectContent>
        </Select>
      </div>

      {options.map((option, index) => (
        <div key={option.id} className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span
              className={cn(
                "text-sm font-medium transition-colors duration-200",
                focusedIndex === index ? "text-primary" : ""
              )}
            >
              {option.identifier}
            </span>
            <div className="relative w-[100px]">
              <Input
                type="number"
                min="1"
                max="100"
                step="1"
                inputMode="decimal"
                value={weights[index]}
                onChange={(e) => updateWeight(index, e.target.value)}
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex(null)}
                className={cn(
                  "pr-3 transition-shadow duration-200", // Increased padding for keyboard hints
                  focusedIndex === index
                    ? "ring-2 ring-primary ring-offset-2"
                    : ""
                )}
              />
              <div
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-200 flex items-center gap-1",
                  focusedIndex === index
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <span>%</span>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="relative">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/50 mt-4">
          {options.map((option, i) => {
            const curentWeight = weights[i];
            const initialWeight = initialWeights[i];
            if (!curentWeight || !initialWeight) return null;
            return (
              <div
                key={option.id}
                className={cn(
                  "h-full float-left transition-all duration-500 ease-in-out cursor-pointer group relative",
                  WEIGHT_COLORS[i % WEIGHT_COLORS.length],
                  focusedIndex === i ? "ring-2 ring-primary ring-offset-2" : ""
                )}
                style={{
                  width: `${curentWeight}%`,
                }}
                title={`${option.identifier}: ${curentWeight.toFixed(2)}%`}
              >
                {isDirty && (
                  <div
                    className="absolute inset-0 opacity-20 bg-muted-foreground"
                    style={{
                      width: `${initialWeight}%`,
                      left: curentWeight > initialWeight ? 0 : "auto",
                      right: curentWeight <= initialWeight ? 0 : "auto",
                      borderRight:
                        curentWeight > initialWeight
                          ? "2px dashed currentColor"
                          : "none",
                      borderLeft:
                        curentWeight <= initialWeight
                          ? "2px dashed currentColor"
                          : "none",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="sr-only" aria-live="polite">
        {isDirty && `Changes pending. Total weight: ${weightsSum.toFixed(2)}%`}
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="text-sm">
          {showError && (
            <p className="text-destructive">
              Weights must add up to 100% (currently {weightsSum.toFixed(2)}%)
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {isDirty && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onRevert}
                    variant="ghost"
                    size="sm"
                    className="hover:bg-muted"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="p-4">
                  {getRevertTooltipContent()}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button
            onClick={onSave}
            disabled={!isValidWeightSum || !isDirty}
            size="sm"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Weights;
