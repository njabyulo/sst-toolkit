import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import type { IWorkflowEdge } from "@sst-toolkit/shared/types/workflow";

function WorkflowEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
}: EdgeProps<IWorkflowEdge>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeType = data?.type || "dependency";
  const edgeStyles = {
    parent: { stroke: "#3b82f6", strokeWidth: 2, strokeDasharray: "0" },
    dependency: { stroke: "#8b5cf6", strokeWidth: 2, strokeDasharray: "5,5" },
    event: { stroke: "#10b981", strokeWidth: 2, strokeDasharray: "0" },
    data: { stroke: "#f59e0b", strokeWidth: 2, strokeDasharray: "0" },
  };

  const edgeStyle = {
    ...style,
    ...edgeStyles[edgeType],
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={edgeStyle}
      />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 12,
              pointerEvents: "all",
            }}
            className="nodrag nopan bg-background/80 px-1 py-0.5 rounded text-xs text-muted-foreground"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const WorkflowEdge = memo(WorkflowEdgeComponent);

