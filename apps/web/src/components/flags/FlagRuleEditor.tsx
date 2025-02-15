import {
  type FlagRuleSet,
  getDisplayNameForOperator,
  getOperatorsForType,
} from "@tryabby/core/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import { Input } from "components/ui/input";
import { Button } from "components/ui/button";
import { Switch } from "components/ui/switch";
import type { ValidatorType } from "@tryabby/core";
import type { FeatureFlagType } from "@prisma/client";
import { useCallback } from "react";
import { match } from "ts-pattern";
import { Label } from "components/ui/label";
import { JSONEditor } from "components/JSONEditor";

interface FlagRuleEditorProps {
  rule: FlagRuleSet[number];
  onChange: (rule: FlagRuleSet[number]) => void;
  onRemove: () => void;
  userSchema: Record<string, ValidatorType>;
  flagType: FeatureFlagType;
  flagName: string;
  flagValue: string;
}

export function FlagRuleEditor({
  rule,
  onChange,
  onRemove,
  flagType,
  userSchema,
  flagName,
  flagValue,
}: FlagRuleEditorProps) {
  const renderThenValueComponent = useCallback(() => {
    if ("rules" in rule) return null;
    return match(flagType)
      .with("BOOLEAN", () => (
        <Switch
          checked={rule.thenValue === "true"}
          onCheckedChange={(checked) => {
            onChange({ ...rule, thenValue: checked ? "true" : "false" });
          }}
        />
      ))
      .with("NUMBER", () => (
        <Input
          value={rule.thenValue.toString()}
          onChange={(e) => onChange({ ...rule, thenValue: e.target.value })}
          type="number"
        />
      ))
      .with("STRING", () => (
        <Input
          value={rule.thenValue.toString()}
          onChange={(e) => onChange({ ...rule, thenValue: e.target.value })}
          type="string"
        />
      ))
      .with("JSON", () => (
        <JSONEditor
          value={rule.thenValue.toString()}
          onChange={(e) => onChange({ ...rule, thenValue: e })}
        />
      ))
      .exhaustive();
  }, [flagType, onChange, rule]);

  if ("rules" in rule) {
    return (
      <div className="border p-4 my-2 rounded-md flex flex-col gap-3">
        <Select
          value={rule.operator}
          onValueChange={(value: "and" | "or") =>
            onChange({ ...rule, operator: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="and">AND</SelectItem>
            <SelectItem value="or">OR</SelectItem>
          </SelectContent>
        </Select>
        {rule.rules.map((subRule, index) => (
          <FlagRuleEditor
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
            key={index}
            rule={subRule}
            onChange={(updatedRule) => {
              // biome-ignore lint/suspicious/noExplicitAny: <explanation>
              const newRules = [...rule.rules] as any[];
              newRules[index] = updatedRule;
              onChange({ ...rule, rules: newRules });
            }}
            onRemove={() => {
              const newRules = [...rule.rules];
              newRules.splice(index, 1);
              onChange({ ...rule, rules: newRules });
            }}
            userSchema={userSchema}
            flagType={flagType}
            flagName={flagName}
            flagValue={flagValue}
          />
        ))}
        <div>
          <Button
            onClick={() =>
              onChange({
                ...rule,
                rules: [
                  ...rule.rules,
                  {
                    propertyName: "",
                    propertyType: "string",
                    operator: "eq",
                    value: "",
                    thenValue: flagValue,
                  },
                ],
              })
            }
          >
            Add Sub-Rule
          </Button>
          <Button variant="destructive" onClick={onRemove} className="ml-2">
            Remove Group
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 my-2">
      <div className="flex flex-col gap-1 w-full">
        <Label>Property</Label>
        <Select
          value={rule.propertyName}
          onValueChange={(value) => {
            if (!userSchema[value]) return;
            onChange({
              ...rule,
              propertyName: value,
              propertyType: userSchema[value].type,
            } as FlagRuleSet[number]);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(userSchema).map((key) => (
              <SelectItem key={key} value={key}>
                {key}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1 w-full">
        <Label>Operator</Label>
        <Select
          value={rule.operator}
          onValueChange={(value) =>
            onChange({
              ...rule,
              operator: value as FlagRuleSet[number]["operator"],
            } as FlagRuleSet[number])
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {getOperatorsForType(rule.propertyType).map((op) => (
              <SelectItem key={op} value={op}>
                {getDisplayNameForOperator(op)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1 w-full">
        <Label>Condition</Label>
        {rule.propertyType === "boolean" ? (
          <Select
            value={rule.value.toString()}
            onValueChange={(value) =>
              onChange({
                ...rule,
                value: value === "true",
              } as FlagRuleSet[number])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">TRUE</SelectItem>
              <SelectItem value="false">FALSE</SelectItem>
            </SelectContent>
          </Select>
        ) : rule.propertyType === "number" ? (
          <Input
            type="number"
            value={rule.value as number}
            onChange={(e) =>
              onChange({ ...rule, value: Number.parseFloat(e.target.value) })
            }
          />
        ) : (
          <Input
            value={rule.value as string}
            onChange={(e) => onChange({ ...rule, value: e.target.value })}
          />
        )}
      </div>
      <div className="flex flex-col gap-1 w-full">
        <Label>Value</Label>
        {renderThenValueComponent()}
      </div>
      <Button variant="destructive" onClick={onRemove}>
        Remove
      </Button>
    </div>
  );
}
