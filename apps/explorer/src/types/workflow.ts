import type { ISSTResource } from "./state";

export type TWorkflowNodeType = "resource" | "condition" | "trigger" | "action";
export type TWorkflowNodeStatus = "completed" | "running" | "failed" | "pending";
export type TWorkflowEdgeType = "parent" | "dependency" | "event" | "data";

export interface IWorkflowNode {
  id: string;
  type: TWorkflowNodeType;
  data: {
    resource?: ISSTResource;
    label: string;
    status: TWorkflowNodeStatus;
    category: string;
    provider: string;
  };
  position: { x: number; y: number };
}

export interface IWorkflowEdge {
  id: string;
  source: string;
  target: string;
  type: TWorkflowEdgeType;
  label?: string;
}

export interface IWorkflow {
  nodes: IWorkflowNode[];
  edges: IWorkflowEdge[];
}

