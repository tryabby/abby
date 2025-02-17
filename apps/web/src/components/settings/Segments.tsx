import type { UserSegment } from "@prisma/client";
import type { ValidatorType } from "@tryabby/core";
import { Card, CardContent } from "components/ui/card";

interface UserSegmentDisplayProps {
  segment: UserSegment;
}

function getTypeColor(type: ValidatorType["type"]) {
  switch (type) {
    case "string":
      return "bg-green-500/10 text-green-500";
    case "number":
      return "bg-blue-500/10 text-blue-500";
    case "boolean":
      return "bg-purple-500/10 text-purple-500";
    default:
      return "bg-gray-500/10 text-gray-500";
  }
}

export function UserSegmentDisplay({ segment }: UserSegmentDisplayProps) {
  const schema = segment.schema as Record<string, ValidatorType>;

  return (
    <Card className="group relative hover:shadow-md transition-all duration-200 hover:border-primary/20 overflow-hidden">
      <div className="absolute top-0 right-0 h-full w-1.5 bg-gradient-to-b from-primary/20 to-primary/5" />
      <CardContent className="pt-6">
        <div className="grid gap-3">
          {Object.entries(schema).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between group/item hover:bg-muted/50 rounded-lg px-3 py-2 transition-colors"
            >
              <div className="flex items-center gap-2">
                <code className="font-mono text-sm font-medium group-hover/item:text-primary transition-colors">
                  {key}
                </code>
                {value.optional && (
                  <span className="px-1.5 py-0.5 text-[10px] uppercase tracking-wider rounded border border-yellow-500/20 text-yellow-500 font-medium">
                    optional
                  </span>
                )}
              </div>
              <span
                className={`px-2 py-0.5 text-xs rounded-md font-medium ${getTypeColor(value.type)}`}
              >
                {value.type}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
