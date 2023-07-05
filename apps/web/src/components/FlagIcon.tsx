import { FeatureFlagType } from "@prisma/client";
import {
  Baseline,
  Binary,
  Hash,
  LucideProps,
  ToggleLeft,
  CurlyBraces,
} from "lucide-react";
import { match } from "ts-pattern";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";

type Props = {
  type: FeatureFlagType;
} & LucideProps;

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
