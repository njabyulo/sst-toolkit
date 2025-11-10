import type { ISSTResource } from "@sst-toolkit/shared/types/sst";
import type { IWorkflowNode, IWorkflow, TWorkflowNodeStatus } from "@sst-toolkit/shared/types/workflow";
import { getResourceName, getResourceTypeDisplay, getResourceTypeCategory, getResourceProvider } from "./state-parser";

export function buildWorkflowNodes(
  resources: ISSTResource[],
  layout: "hierarchical" | "force-directed" = "hierarchical"
): IWorkflowNode[] {
  const nodes: IWorkflowNode[] = [];
  const positions = calculateNodePositions(resources, layout);

  resources.forEach((resource) => {
    const name = getResourceName(resource);
    const type = getResourceTypeDisplay(resource.type);
    const category = getResourceTypeCategory(resource.type, resource);
    const provider = getResourceProvider(resource.type);
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
  const nodeWidth = 250; // Increased from 200
  const nodeHeight = 120; // Increased from 100
  const horizontalSpacing = 400; // Increased from 350
  const verticalSpacing = 300; // Increased from 250
  const minNodeGap = 200; // Minimum gap between nodes (increased from 150)

  if (layout === "hierarchical") {
    // Group resources by parent
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

    // Position root resources horizontally with better spacing
    const rootSpacing = Math.max(horizontalSpacing, minNodeGap + nodeWidth);
    rootResources.forEach((resource, index) => {
      positions.set(resource.urn, {
        x: index * rootSpacing + 300, // Increased from 200
        y: 300, // Increased from 200
      });
    });

    // Position children below their parents
    const positionChildren = (parentUrn: string, level: number): void => {
      const children = childrenMap.get(parentUrn) || [];
      const parentPos = positions.get(parentUrn);
      if (!parentPos) return;

      // Calculate spacing for children to ensure they don't overlap
      // For many children, use wider spacing to prevent cramping
      const baseSpacing = children.length > 5 ? horizontalSpacing * 1.5 : horizontalSpacing;
      // Ensure minimum spacing is always maintained (minNodeGap + nodeWidth)
      const childSpacing = Math.max(minNodeGap + nodeWidth, baseSpacing);
      
      // Calculate total width needed for children
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
    // Force-directed layout: simple grid for now
    const cols = Math.ceil(Math.sqrt(resources.length));
    resources.forEach((resource, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      positions.set(resource.urn, {
        x: col * horizontalSpacing + 200, // Increased from 100
        y: row * verticalSpacing + 200, // Increased from 100
      });
    });
  }

  // Post-process to ensure minimum spacing between all nodes
  // Group nodes by row (similar Y coordinates)
  const nodeRows = new Map<number, Array<{ urn: string; x: number; y: number }>>();
  const rowTolerance = verticalSpacing * 0.3; // Nodes within this Y distance are in the same row
  
  resources.forEach((resource) => {
    const pos = positions.get(resource.urn) || { x: 0, y: 0 };
    // Find existing row or create new one
    let foundRow = false;
    for (const [rowY, nodes] of nodeRows.entries()) {
      if (Math.abs(pos.y - rowY) < rowTolerance) {
        nodes.push({ urn: resource.urn, x: pos.x, y: rowY }); // Use rowY for consistency
        foundRow = true;
        break;
      }
    }
    if (!foundRow) {
      nodeRows.set(pos.y, [{ urn: resource.urn, x: pos.x, y: pos.y }]);
    }
  });
  
  // Sort each row by X coordinate and ensure minimum spacing
  const finalPositions = new Map<string, { x: number; y: number }>();
  
  for (const [rowY, nodes] of nodeRows.entries()) {
    // Sort nodes in row by X coordinate
    nodes.sort((a, b) => a.x - b.x);
    
    // Adjust positions to ensure minimum spacing
    nodes.forEach((node, index) => {
      if (index === 0) {
        // First node in row - keep its position
        finalPositions.set(node.urn, { x: node.x, y: rowY });
      } else {
        // Ensure minimum gap from previous node
        const prevNode = nodes[index - 1];
        const prevPos = finalPositions.get(prevNode.urn) || { x: prevNode.x, y: rowY };
        // Calculate required X position to maintain minimum gap
        const requiredX = prevPos.x + nodeWidth + minNodeGap;
        // Use the maximum of required position and original position
        const adjustedX = Math.max(requiredX, node.x);
        finalPositions.set(node.urn, { x: adjustedX, y: rowY });
      }
    });
  }
  
  return finalPositions;
}

function determineResourceStatus(resource: ISSTResource): TWorkflowNodeStatus {
  // For now, default to "completed" - can be enhanced with actual status checking
  if (resource.created && resource.modified) {
    return "completed";
  }
  return "pending";
}

export function buildWorkflow(
  resources: ISSTResource[],
  relationships: ReturnType<typeof import("./relationship-parser").parseResourceRelationships>
): IWorkflow {
  const nodes = buildWorkflowNodes(resources);
  const edges = relationships;

  return {
    nodes,
    edges,
  };
}

