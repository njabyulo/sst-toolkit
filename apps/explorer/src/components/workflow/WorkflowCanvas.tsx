import { useCallback, useMemo, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ResourceNode } from "./ResourceNode";
import { WorkflowEdge } from "./WorkflowEdge";
import type { IWorkflowNode, IWorkflowEdge } from "@sst-toolkit/shared/types/workflow";

interface WorkflowCanvasProps {
  nodes: IWorkflowNode[];
  edges: IWorkflowEdge[];
  onNodeSelect?: (nodeId: string) => void;
  selectedNodeId?: string;
}

export function WorkflowCanvas({
  nodes: initialNodes,
  edges: initialEdges,
  onNodeSelect,
  selectedNodeId,
}: WorkflowCanvasProps) {
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      resource: ResourceNode,
    }),
    []
  );

  const edgeTypes: EdgeTypes = useMemo(
    () => ({
      default: WorkflowEdge,
    }),
    []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialNodes as Node[]
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialEdges as Edge[]
  );

  // Update nodes when initialNodes change
  useEffect(() => {
    setNodes(initialNodes as Node[]);
  }, [initialNodes, setNodes]);

  // Update edges when initialEdges change
  useEffect(() => {
    setEdges(initialEdges as Edge[]);
  }, [initialEdges, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeSelect?.(node.id);
    },
    [onNodeSelect]
  );

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        fitView
        attributionPosition="bottom-left"
      >
        <Background />
        <Controls />
        <MiniMap />
        <Panel position="top-left" className="bg-background/80 p-2 rounded">
          <div className="text-sm text-muted-foreground">
            {nodes.length} nodes • {edges.length} connections
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

