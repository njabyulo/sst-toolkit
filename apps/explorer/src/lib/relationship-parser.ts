import type { ISSTResource } from "@sst-toolkit/shared/types/sst";
import type { IWorkflowEdge, TWorkflowEdgeType } from "@sst-toolkit/shared/types/workflow";

export function parseResourceRelationships(
  resources: ISSTResource[]
): IWorkflowEdge[] {
  const edges: IWorkflowEdge[] = [];
  const resourceMap = new Map<string, ISSTResource>();

  resources.forEach((resource) => {
    resourceMap.set(resource.urn, resource);
  });

  resources.forEach((resource) => {
    // Parent-child relationships
    if (resource.parent) {
      edges.push({
        id: `${resource.parent}->${resource.urn}`,
        source: resource.parent,
        target: resource.urn,
        type: "parent",
      });
    }

    // Dependencies from outputs/inputs
    const outputs = resource.outputs || {};
    Object.values(outputs).forEach((value) => {
      if (typeof value === "string" && value.startsWith("urn:")) {
        if (resourceMap.has(value)) {
          edges.push({
            id: `${resource.urn}->${value}`,
            source: resource.urn,
            target: value,
            type: "dependency",
          });
        }
      } else if (typeof value === "object" && value !== null) {
        // Check nested objects for URN references
        const checkForUrns = (obj: unknown): void => {
          if (typeof obj === "string" && obj.startsWith("urn:")) {
            if (resourceMap.has(obj)) {
              edges.push({
                id: `${resource.urn}->${obj}`,
                source: resource.urn,
                target: obj,
                type: "dependency",
              });
            }
          } else if (Array.isArray(obj)) {
            obj.forEach(checkForUrns);
          } else if (typeof obj === "object" && obj !== null) {
            Object.values(obj).forEach(checkForUrns);
          }
        };
        checkForUrns(value);
      }
    });

    // Check inputs for dependencies
    const inputs = resource.inputs || {};
    Object.values(inputs).forEach((value) => {
      if (typeof value === "string" && value.startsWith("urn:")) {
        if (resourceMap.has(value)) {
          edges.push({
            id: `${value}->${resource.urn}`,
            source: value,
            target: resource.urn,
            type: "dependency",
          });
        }
      }
    });

    // Detect event-driven connections (EventBridge rules, SQS triggers, etc.)
    const type = resource.type.toLowerCase();
    if (type.includes("eventbridge") || type.includes("bus")) {
      // EventBridge resources can trigger other resources
      const targets = outputs.targets || outputs.rules || [];
      if (Array.isArray(targets)) {
        targets.forEach((target: unknown) => {
          if (typeof target === "string" && target.startsWith("urn:")) {
            if (resourceMap.has(target)) {
              edges.push({
                id: `${resource.urn}->${target}`,
                source: resource.urn,
                target: target,
                type: "event",
                label: "triggers",
              });
            }
          }
        });
      }
    }

    // Detect API Gateway routes
    if (type.includes("apigateway") || type.includes("route")) {
      const handler = outputs.handler || inputs.handler;
      if (typeof handler === "string" && handler.startsWith("urn:")) {
        if (resourceMap.has(handler)) {
          edges.push({
            id: `${resource.urn}->${handler}`,
            source: resource.urn,
            target: handler,
            type: "data",
            label: "calls",
          });
        }
      }
    }
  });

  // Remove duplicate edges
  const uniqueEdges = new Map<string, IWorkflowEdge>();
  edges.forEach((edge) => {
    const key = `${edge.source}->${edge.target}:${edge.type}`;
    if (!uniqueEdges.has(key)) {
      uniqueEdges.set(key, edge);
    }
  });

  return Array.from(uniqueEdges.values());
}

