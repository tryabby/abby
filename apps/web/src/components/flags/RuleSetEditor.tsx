"use client";

import type { FeatureFlagType } from "@prisma/client";
import type { ValidatorType } from "@tryabby/core";
import type { FlagRuleSet } from "@tryabby/core/schema";
import { Button } from "components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { Label } from "components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";
import { ArrowRight, Plus, Trash } from "lucide-react";
import { useState } from "react";
import { FlagRuleEditor, ThenValueInput } from "./FlagRuleEditor";

export function FlagRulesEditor({
  userSchema,
  flagValue,
  flagType,
  onSave,
  initialData,
}: {
  userSchema: Record<string, ValidatorType>;
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
        thenValue: flagValue,
      },
    ]);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>Rule Configuration</span>
            <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
              {ruleSet.length} {ruleSet.length === 1 ? "rule" : "rules"}
            </span>
          </div>
          <Button variant="default" size="sm" onClick={() => onSave(ruleSet)}>
            Save Changes
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {ruleSet.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed rounded-lg bg-muted/5">
            <div className="mb-4 p-4 rounded-full bg-muted/50">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              No rules configured yet
            </p>
            <p className="text-xs text-muted-foreground mb-6 max-w-sm">
              Rules allow you to dynamically control flag values based on user
              properties
            </p>
            <div className="flex gap-3">
              <Button size="sm" variant="outline" onClick={addRule}>
                <Plus className="h-4 w-4 mr-2" /> Add Single Rule
              </Button>
              <Button size="sm" variant="outline" onClick={addGroup}>
                <Plus className="h-4 w-4 mr-2" /> Add Rule Group
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {ruleSet.map((rule, index) => {
                if ("rules" in rule) {
                  return (
                    <Card
                      // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                      key={index}
                      className="relative border-primary/10 bg-primary/[0.03] shadow-sm"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 rounded-l-lg" />
                      <CardContent className="p-6">
                        <div className="grid gap-6">
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <Label className="text-lg font-medium flex items-center gap-2">
                                If
                                <Select
                                  value={rule.operator}
                                  onValueChange={(value: "and" | "or") =>
                                    updateRule(index, {
                                      ...rule,
                                      operator: value,
                                    })
                                  }
                                >
                                  <SelectTrigger className="w-[200px] bg-background">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="and">
                                      ALL conditions match
                                    </SelectItem>
                                    <SelectItem value="or">
                                      ANY condition matches
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </Label>
                            </div>

                            <div className="pl-6 border-l-2 border-primary/20 space-y-4">
                              {rule.rules.map((subRule, subRuleIndex) => (
                                // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                                <div key={subRuleIndex} className="relative">
                                  <FlagRuleEditor
                                    rule={subRule}
                                    onChange={(updatedRule) => {
                                      const newRules = [...rule.rules];
                                      newRules[subRuleIndex] = updatedRule;
                                      updateRule(index, {
                                        ...rule,
                                        rules: newRules,
                                      });
                                    }}
                                    onRemove={() => {
                                      const newRules = [...rule.rules];
                                      newRules.splice(subRuleIndex, 1);
                                      updateRule(index, {
                                        ...rule,
                                        rules: newRules,
                                      });
                                    }}
                                    userSchema={userSchema}
                                    flagType={flagType}
                                  />
                                </div>
                              ))}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  updateRule(index, {
                                    ...rule,
                                    rules: [
                                      ...rule.rules,
                                      {
                                        propertyName: "",
                                        propertyType: "string",
                                        operator: "eq",
                                        value: "",
                                      },
                                    ],
                                  })
                                }
                                className="mt-2"
                              >
                                <Plus className="h-4 w-4 mr-2" /> Add Condition
                              </Button>
                            </div>
                          </div>

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
                              <span className="text-sm font-normal text-muted-foreground px-2 py-0.5 rounded-full bg-muted/50">
                                ({flagType.toLowerCase()})
                              </span>
                            </Label>
                            <div className="pl-6 pt-2 border-l-2 border-primary/20">
                              <ThenValueInput
                                flagType={flagType}
                                thenValue={rule.thenValue}
                                onChange={(value) =>
                                  updateRule(index, {
                                    ...rule,
                                    thenValue: value,
                                  })
                                }
                              />
                            </div>
                          </div>

                          <div className="flex justify-end pt-4 border-t border-border">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRule(index)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash className="h-4 w-4 mr-2" /> Remove Group
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }

                return (
                  <Card
                    // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                    key={index}
                    className="relative border-muted bg-muted/5"
                  >
                    <CardContent className="p-6">
                      <div className="grid gap-4">
                        <div className="flex items-center gap-2">
                          <Label className="text-lg font-medium">
                            If condition matches
                          </Label>
                        </div>
                        <FlagRuleEditor
                          rule={rule}
                          onChange={(updatedRule) =>
                            updateRule(index, updatedRule)
                          }
                          onRemove={() => removeRule(index)}
                          userSchema={userSchema}
                          flagType={flagType}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex gap-3 pt-4 border-t border-border">
              <Button size="sm" variant="outline" onClick={addRule}>
                <Plus className="h-4 w-4 mr-2" /> Add Single Rule
              </Button>
              <Button size="sm" variant="outline" onClick={addGroup}>
                <Plus className="h-4 w-4 mr-2" /> Add Rule Group
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
