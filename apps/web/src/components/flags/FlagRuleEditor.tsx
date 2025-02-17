import type { FeatureFlagType } from "@prisma/client";
import type { FlagRule, SubFlagRule, ValidatorType } from "@tryabby/core";
import {
  type FlagRuleSet,
  getDisplayNameForOperator,
  getOperatorsForType,
} from "@tryabby/core/schema";
import { JSONEditor } from "components/JSONEditor";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import { Switch } from "components/ui/switch";
import { ArrowRight, Trash } from "lucide-react";
import { match } from "ts-pattern";

export function ThenValueInput({
  flagType,
  onChange,
  thenValue,
}: {
  flagType: FeatureFlagType;
  thenValue: FlagRule["thenValue"];
  onChange: (thenValue: FlagRule["thenValue"]) => void;
}) {
  return (
    <div className="w-full">
      {match(flagType)
        .with("BOOLEAN", () => (
          <div className="flex items-center space-x-3">
            <Switch
              checked={thenValue === "true"}
              onCheckedChange={(checked) => {
                onChange(checked ? "true" : "false");
              }}
            />
            <Label className="text-sm text-muted-foreground">
              {thenValue === "true" ? "Enabled" : "Disabled"}
            </Label>
          </div>
        ))
        .with("NUMBER", () => (
          <Input
            className="max-w-[200px]"
            value={thenValue.toString()}
            onChange={(e) => onChange(e.target.value)}
            type="number"
            placeholder="Enter number value"
          />
        ))
        .with("STRING", () => (
          <Input
            className="max-w-[300px]"
            value={thenValue.toString()}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter string value"
          />
        ))
        .with("JSON", () => (
          <div className="w-full max-w-[500px]">
            <JSONEditor
              value={thenValue.toString()}
              onChange={(e) => onChange(e)}
            />
          </div>
        ))
        .exhaustive()}
    </div>
  );
}

type FlagRuleEditorProps<T extends FlagRule | SubFlagRule> = {
  rule: T;
  onChange: (rule: T) => void;
  onRemove: () => void;
  userSchema: Record<string, ValidatorType>;
  flagType: FeatureFlagType;
};

export function FlagRuleEditor<T extends FlagRule | SubFlagRule>({
  rule,
  onChange,
  onRemove,
  flagType,
  userSchema,
}: FlagRuleEditorProps<T>) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[2fr_2fr_2fr_auto] gap-4 items-end relative">
        <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-6 h-px bg-border" />

        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            Property
            <span className="text-xs font-normal text-muted-foreground">
              ({rule.propertyType})
            </span>
          </Label>
          <Select
            value={rule.propertyName}
            onValueChange={(value) => {
              if (!userSchema[value]) return;
              onChange({
                ...rule,
                propertyName: value,
                propertyType: userSchema[value].type,
              });
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select property" />
            </SelectTrigger>
            <SelectContent>
              <div className="p-2">
                <div className="text-xs text-muted-foreground mb-2">
                  User Properties
                </div>
                {Object.entries(userSchema).map(([key, schema]) => (
                  <SelectItem
                    key={key}
                    value={key}
                    className="flex items-center gap-2"
                  >
                    <span>{key}</span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({schema.type})
                    </span>
                  </SelectItem>
                ))}
              </div>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Operator</Label>
          <Select
            value={rule.operator}
            onValueChange={(value) =>
              onChange({
                ...rule,
                operator: value as FlagRuleSet[number]["operator"],
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select operator" />
            </SelectTrigger>
            <SelectContent>
              <div className="p-2">
                <div className="text-xs text-muted-foreground mb-2">
                  Available Operators
                </div>
                {getOperatorsForType(rule.propertyType).map((op) => (
                  <SelectItem key={op} value={op}>
                    {getDisplayNameForOperator(op)}
                  </SelectItem>
                ))}
              </div>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Value</Label>
          {rule.propertyType === "boolean" ? (
            <Select
              value={rule.value.toString()}
              onValueChange={(value) =>
                onChange({
                  ...rule,
                  value: value === "true",
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">True</SelectItem>
                <SelectItem value="false">False</SelectItem>
              </SelectContent>
            </Select>
          ) : rule.propertyType === "number" ? (
            <div className="space-y-1.5">
              <Input
                type="number"
                placeholder="Enter number"
                value={rule.value as number}
                onChange={(e) =>
                  onChange({
                    ...rule,
                    value: Number.parseFloat(e.target.value),
                  })
                }
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Input
                placeholder="Enter value"
                value={rule.value as string}
                onChange={(e) => onChange({ ...rule, value: e.target.value })}
              />
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-10 w-10 hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>

      {"thenValue" in rule && (
        <>
          <div className="flex items-center gap-4 my-6">
            <div className="h-px flex-1 bg-border" />
            <div className="bg-muted rounded-full p-2">
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-4">
            <Label className="text-lg font-medium flex items-center gap-2">
              Then return
              <span className="text-sm font-normal text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                {flagType.toLowerCase()}
              </span>
            </Label>
            <div className="pl-6 pt-2 border-l-2 border-border">
              <ThenValueInput
                flagType={flagType}
                thenValue={rule.thenValue}
                onChange={(thenValue) => onChange({ ...rule, thenValue })}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
