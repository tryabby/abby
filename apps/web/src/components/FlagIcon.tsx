import type { FeatureFlagType } from "@prisma/client";
import { Baseline, CurlyBraces, Hash, ToggleLeft } from "lucide-react";
import { match } from "ts-pattern";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";

type Props = {
  type: FeatureFlagType;
  className?: string;
};

export function FlagIcon({ type, ...iconProps }: Props) {
  return (
    <>
      <Tooltip>
        <TooltipContent>
          <span>
            This Flag has the type <code className="lowercase">{type}</code>
          </span>
        </TooltipContent>
        <TooltipTrigger>
          {match(type)
            .with("BOOLEAN", () => <ToggleLeft {...iconProps} />)
            .with("NUMBER", () => <Hash {...iconProps} />)
            .with("STRING", () => <Baseline {...iconProps} />)
            .with("JSON", () => <CurlyBraces {...iconProps} />)
            .exhaustive()}
        </TooltipTrigger>
      </Tooltip>
    </>
  );
}
