import type { ISSTResource } from "@sst-toolkit/shared/types/sst";
import type { IWorkflowNode, IWorkflow, TWorkflowNodeStatus } from "@sst-toolkit/shared/types/workflow";
import * as State from "../state/state";
import * as Relationships from "../relationships/relationships";

export function buildWorkflowNodes(
  resources: ISSTResource[],
  layout: "hierarchical" | "force-directed" = "hierarchical"
): IWorkflowNode[] {
  const nodes: IWorkflowNode[] = [];
  const positions = calculateNodePositions(resources, layout);

  resources.forEach((resource) => {
    const name = State.getResourceName(resource);
    const category = State.getResourceTypeCategory(resource.type, resource);
    const provider = State.getResourceProvider(resource.type);
    const status = determineResourceStatus(resource);

    nodes.push({
      id: resource.urn,
      type: "resource",
      data: {
        resource,
        label: name,
        status,
        category,
        provider,
      },
      position: positions.get(resource.urn) || { x: 0, y: 0 },
    });
  });

  return nodes;
}

function calculateNodePositions(
  resources: ISSTResource[],
  layout: "hierarchical" | "force-directed"
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const nodeWidth = 250;
  const horizontalSpacing = 400;
  const verticalSpacing = 300;
  const minNodeGap = 200;

  if (layout === "hierarchical") {
    const rootResources = resources.filter((r) => !r.parent);
    const childrenMap = new Map<string, ISSTResource[]>();

    resources.forEach((resource) => {
      if (resource.parent) {
        if (!childrenMap.has(resource.parent)) {
          childrenMap.set(resource.parent, []);
        }
        childrenMap.get(resource.parent)?.push(resource);
      }
    });

    const rootSpacing = Math.max(horizontalSpacing, minNodeGap + nodeWidth);
    rootResources.forEach((resource, index) => {
      positions.set(resource.urn, {
        x: index * rootSpacing + 300,
        y: 300,
      });
    });

    const positionChildren = (parentUrn: string, level: number): void => {
      const children = childrenMap.get(parentUrn) || [];
      const parentPos = positions.get(parentUrn);
      if (!parentPos) return;

      const baseSpacing = children.length > 5 ? horizontalSpacing * 1.5 : horizontalSpacing;
      const childSpacing = Math.max(minNodeGap + nodeWidth, baseSpacing);
      
      const totalWidth = (children.length - 1) * childSpacing;
      const startX = parentPos.x - totalWidth / 2;
      
      children.forEach((child, index) => {
        const x = startX + index * childSpacing;
        const y = parentPos.y + verticalSpacing;
        positions.set(child.urn, { x, y });
        positionChildren(child.urn, level + 1);
      });
    };

    rootResources.forEach((resource) => {
      positionChildren(resource.urn, 1);
    });
  } else {
    const cols = Math.ceil(Math.sqrt(resources.length));
    resources.forEach((resource, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      positions.set(resource.urn, {
        x: col * horizontalSpacing + 200,
        y: row * verticalSpacing + 200,
      });
    });
  }

  const nodeRows = new Map<number, Array<{ urn: string; x: number; y: number }>>();
  const rowTolerance = verticalSpacing * 0.3;
  
  resources.forEach((resource) => {
    const pos = positions.get(resource.urn) || { x: 0, y: 0 };
    let foundRow = false;
    for (const [rowY, nodes] of nodeRows.entries()) {
      if (Math.abs(pos.y - rowY) < rowTolerance) {
        nodes.push({ urn: resource.urn, x: pos.x, y: rowY });
        foundRow = true;
        break;
      }
    }
    if (!foundRow) {
      nodeRows.set(pos.y, [{ urn: resource.urn, x: pos.x, y: pos.y }]);
    }
  });
  
  const finalPositions = new Map<string, { x: number; y: number }>();
  
  for (const [rowY, nodes] of nodeRows.entries()) {
    nodes.sort((a, b) => a.x - b.x);
    
    nodes.forEach((node, index) => {
      if (index === 0) {
        finalPositions.set(node.urn, { x: node.x, y: rowY });
      } else {
        const prevNode = nodes[index - 1];
        const prevPos = finalPositions.get(prevNode.urn) || { x: prevNode.x, y: rowY };
        const requiredX = prevPos.x + nodeWidth + minNodeGap;
        const adjustedX = Math.max(requiredX, node.x);
        finalPositions.set(node.urn, { x: adjustedX, y: rowY });
      }
    });
  }
  
  return finalPositions;
}

function determineResourceStatus(resource: ISSTResource): TWorkflowNodeStatus {
  if (resource.created && resource.modified) {
    return "completed";
  }
  return "pending";
}

export function buildWorkflow(
  resources: ISSTResource[],
  relationships: ReturnType<typeof Relationships.parseResourceRelationships>
): IWorkflow {
  const nodes = buildWorkflowNodes(resources);
  const edges = relationships;

  return {
    nodes,
    edges,
  };
}

