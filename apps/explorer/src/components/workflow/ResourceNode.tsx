import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { ResourceIcon } from "../ResourceList";
import { cn } from "~/lib/utils";
import type { IWorkflowNode } from "@sst-toolkit/shared/types/workflow";

function ResourceNodeComponent({ data, selected }: NodeProps<IWorkflowNode["data"]>) {
  const { resource, label, status, category, provider } = data;

  const statusColors = {
    completed: "bg-green-500",
    running: "bg-blue-500",
    failed: "bg-red-500",
    pending: "bg-gray-500",
  };

  const statusLabels = {
    completed: "Completed",
    running: "Running",
    failed: "Failed",
    pending: "Pending",
  };

  return (
    <Card
      className={cn(
        "min-w-[200px] max-w-[250px] shadow-lg",
        selected && "ring-2 ring-primary"
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <div className="mt-1">
            {resource && (
              <ResourceIcon type={resource.type} resource={resource} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{label}</div>
            <div className="text-xs text-muted-foreground truncate">
              {category}
            </div>
            <div className="flex items-center gap-1 mt-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {provider}
              </Badge>
              <Badge
                variant="outline"
                className={cn("text-xs", statusColors[status])}
              >
                {statusLabels[status]}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </Card>
  );
}

export const ResourceNode = memo(ResourceNodeComponent);

