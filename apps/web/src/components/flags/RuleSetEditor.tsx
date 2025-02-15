"use client";

import { useState } from "react";
import { Button } from "components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import type { FlagRuleSet } from "@tryabby/core/schema";
import { FlagRuleEditor } from "./FlagRuleEditor";
import type { ValidatorType } from "@tryabby/core";
import type { FeatureFlagType } from "@prisma/client";

export function FlagRulesEditor({
  userSchema,
  flagName,
  flagValue,
  flagType,
  onSave,
  initialData,
}: {
  userSchema: Record<string, ValidatorType>;
  flagName: string;
  flagValue: string;
  flagType: FeatureFlagType;
  onSave: (ruleSet: FlagRuleSet) => void;
  initialData?: FlagRuleSet;
}) {
  const [ruleSet, setRuleSet] = useState<FlagRuleSet>(initialData ?? []);

  const addRule = () => {
    setRuleSet([
      ...ruleSet,
      {
        propertyName: "",
        propertyType: "string",
        operator: "eq",
        value: "",
        thenValue: flagValue,
      },
    ]);
  };

  const updateRule = (index: number, rule: FlagRuleSet[number]) => {
    const newRuleSet = [...ruleSet];
    newRuleSet[index] = rule;
    setRuleSet(newRuleSet);
  };

  const removeRule = (index: number) => {
    const newRuleSet = [...ruleSet];
    newRuleSet.splice(index, 1);
    setRuleSet(newRuleSet);
  };

  const addGroup = () => {
    setRuleSet([
      ...ruleSet,
      {
        operator: "and",
        rules: [],
      },
    ]);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Flag Rules Editor</CardTitle>
      </CardHeader>
      <CardContent>
        {ruleSet.map((rule, index) => (
          <FlagRuleEditor
            // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
            key={index}
            rule={rule}
            onChange={(updatedRule) => updateRule(index, updatedRule)}
            onRemove={() => removeRule(index)}
            userSchema={userSchema}
            flagName={flagName}
            flagValue={flagValue}
            flagType={flagType}
          />
        ))}
        <div className="flex space-x-2 mt-4">
          <Button variant="secondary" onClick={addRule}>
            Add Rule
          </Button>
          <Button variant="secondary" onClick={addGroup}>
            Add Group
          </Button>
          <Button onClick={() => onSave(ruleSet)}>Save</Button>
        </div>
      </CardContent>
    </Card>
  );
}
