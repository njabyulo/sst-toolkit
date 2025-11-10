# Tool Explorer UI - Challenge & Improvement

## The Challenge: Why a Static List Isn't Enough

### Current Approach (Static Tree/List View)
The current `@tool` explorer shows resources in a **hierarchical tree structure**:
- ✅ Good for browsing resources
- ✅ Good for finding specific resources
- ✅ Good for understanding resource hierarchy
- ❌ **Doesn't show how resources interact**
- ❌ **Doesn't show execution flow**
- ❌ **Doesn't show dependencies visually**
- ❌ **Doesn't help with workflow orchestration**

### The Problem: Missing Context

When you look at a resource in the current view, you see:
- The resource name
- The resource type
- The resource details (inputs/outputs)
- **But NOT:**
  - What triggers this resource?
  - What does this resource trigger?
  - How does data flow through resources?
  - What's the execution sequence?

### Real-World Example

**Scenario**: You have a Lambda function that processes messages from SQS and stores results in DynamoDB.

**Current View Shows:**
```
Resources/
  ├── Function (processMessages)
  ├── Queue (messageQueue)
  └── Table (resultsTable)
```

**What's Missing:**
- The connection: Queue → Function → Table
- The flow: Message arrives → Function processes → Result stored
- The dependencies: Function depends on Queue and Table
- The execution order: Queue triggers Function, Function writes to Table

## The Solution: Visual Workflow Builder

### Inspired by the Workflow Diagram

The workflow diagram shows:
1. **Trigger Node**: "When Deal updated" - starts the workflow
2. **Switch Node**: Conditional logic - routes to different paths
3. **Action Nodes**: "Enroll in sequence" - performs actions
4. **Status Indicators**: Completed/Running - shows state
5. **Connection Lines**: Visual flow between nodes

### Applying This to SST Resources

Transform resources into a **visual workflow** where:

1. **Resources become Nodes**
   - Each resource is a node on a canvas
   - Nodes show status, type, and metadata
   - Nodes are positioned to show flow

2. **Relationships become Connections**
   - Parent-child relationships → solid lines
   - Dependencies → dashed lines
   - Event triggers → colored lines
   - Data flow → arrow lines

3. **Workflow becomes Visual**
   - Execution flow: top to bottom, left to right
   - Conditional logic: switch nodes for routing
   - Status tracking: real-time status per node

## Implementation Strategy

### Phase 1: Foundation (Week 1)

**Goal**: Create a visual canvas with resource nodes

**Components**:
- `WorkflowCanvas.tsx`: Main canvas using React Flow
- `ResourceNode.tsx`: Node component for resources
- `WorkflowLayout.tsx`: Layout algorithm for positioning nodes

**Features**:
- Display all resources as nodes
- Basic node styling (icon, name, status)
- Zoom and pan on canvas
- Node selection and details panel

### Phase 2: Connections (Week 2)

**Goal**: Show relationships between resources

**Components**:
- `WorkflowEdge.tsx`: Connection line component
- `RelationshipParser.ts`: Parse resource relationships
- `ConnectionTypes.ts`: Define connection types

**Features**:
- Detect parent-child relationships
- Detect dependencies (outputs → inputs)
- Detect event triggers (EventBridge rules)
- Visual connection lines with labels

### Phase 3: Workflow Logic (Week 3)

**Goal**: Add conditional logic and workflow orchestration

**Components**:
- `ConditionNode.tsx`: Conditional logic node
- `TriggerNode.tsx`: Event trigger node
- `WorkflowBuilder.tsx`: Workflow construction logic

**Features**:
- Switch/condition nodes for routing
- Trigger nodes for event sources
- Workflow templates
- Execution flow visualization

### Phase 4: Interactive Features (Week 4)

**Goal**: Make it interactive and useful

**Features**:
- Drag-and-drop nodes
- Create new connections
- Filter and group nodes
- Export workflow as image
- Save workflow configurations

## Technical Implementation

### 1. Add React Flow Library

```bash
pnpm add @xyflow/react
```

### 2. Create Workflow Types

```typescript
// types/workflow.ts
export interface IWorkflowNode {
  id: string;
  type: 'resource' | 'condition' | 'trigger' | 'action';
  data: {
    resource?: ISSTResource;
    label: string;
    status: 'completed' | 'running' | 'failed' | 'pending';
    category: string;
    provider: string;
  };
  position: { x: number; y: number };
}

export interface IWorkflowEdge {
  id: string;
  source: string;
  target: string;
  type: 'parent' | 'dependency' | 'event' | 'data';
  label?: string;
}
```

### 3. Parse Resource Relationships

```typescript
// lib/relationship-parser.ts
export function parseResourceRelationships(
  resources: ISSTResource[]
): IWorkflowEdge[] {
  const edges: IWorkflowEdge[] = [];
  
  resources.forEach((resource) => {
    // Parent-child relationships
    if (resource.parent) {
      edges.push({
        id: `${resource.parent}->${resource.urn}`,
        source: resource.parent,
        target: resource.urn,
        type: 'parent',
      });
    }
    
    // Dependencies from outputs/inputs
    const outputs = resource.outputs || {};
    Object.values(outputs).forEach((value) => {
      if (typeof value === 'string' && value.startsWith('urn:')) {
        edges.push({
          id: `${resource.urn}->${value}`,
          source: resource.urn,
          target: value,
          type: 'dependency',
        });
      }
    });
  });
  
  return edges;
}
```

### 4. Create Workflow Canvas Component

```typescript
// components/workflow/WorkflowCanvas.tsx
import ReactFlow, { Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ResourceNode } from './ResourceNode';

export function WorkflowCanvas({
  nodes,
  edges,
}: {
  nodes: Node[];
  edges: Edge[];
}) {
  const nodeTypes = {
    resource: ResourceNode,
  };
  
  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
      />
    </div>
  );
}
```

## Benefits of Visual Workflow Approach

### 1. **Discover Hidden Relationships**
- See dependencies you didn't know existed
- Understand resource interactions
- Identify bottlenecks and optimization opportunities

### 2. **Debug Infrastructure Issues**
- Visualize execution flow to find problems
- See which resources are failing
- Understand error propagation

### 3. **Plan New Resources**
- See where new resources fit in the workflow
- Understand impact of adding resources
- Plan resource dependencies

### 4. **Document Infrastructure**
- Self-documenting through visual workflows
- Share workflows with team
- Onboard new team members faster

### 5. **Optimize Performance**
- Identify redundant resources
- Find optimization opportunities
- Understand resource usage patterns

## Comparison: Static List vs. Visual Workflow

| Feature | Static List | Visual Workflow |
|---------|-------------|------------------|
| Browse resources | ✅ | ✅ |
| Find specific resource | ✅ | ✅ |
| Understand hierarchy | ✅ | ✅ |
| See relationships | ❌ | ✅ |
| See execution flow | ❌ | ✅ |
| Debug issues | ❌ | ✅ |
| Plan new resources | ❌ | ✅ |
| Document infrastructure | ❌ | ✅ |

## Next Steps

1. ✅ Create planning documents
2. ⏭️ Implement Phase 1: Visual Canvas Foundation
3. ⏭️ Implement Phase 2: Relationship Visualization
4. ⏭️ Implement Phase 3: Workflow Orchestration
5. ⏭️ Implement Phase 4: Interactive Features

## Conclusion

The current static list view is good for **browsing** resources, but it doesn't help users **understand** how resources work together. A visual workflow builder transforms the tool explorer from a simple browser into a powerful **workflow visualization and orchestration tool**.

This approach:
- **Challenges** the static list paradigm
- **Improves** user understanding of infrastructure
- **Enables** workflow orchestration and debugging
- **Transforms** the tool explorer into a comprehensive infrastructure visualization tool

