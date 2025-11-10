# Tool Explorer UI - Improvement Plan

## Current State Analysis

### What We Have Now
The current `@tool` explorer is a **static hierarchical tree/list view** that:
- Displays SST resources in a tree structure (ResourceList)
- Shows resource details in a side panel (ResourceDetail)
- Groups resources by category (Function, API, Storage, etc.)
- Provides search and filtering capabilities
- Shows resource statistics and cost information

### The Challenge: Static vs. Dynamic

**Current Limitation:** The tree/list view is excellent for **browsing** resources, but it doesn't help users understand:
- **How resources interact** with each other
- **Dependencies and relationships** between resources
- **Workflow orchestration** - how resources work together
- **Conditional logic** - when and why resources are created/used
- **Execution flow** - the sequence of operations

## Vision: Visual Workflow Builder

Inspired by the workflow diagram, we should transform the tool explorer into a **visual workflow builder** that shows:

1. **Node-Based Visualization**: Each resource is a node on a canvas
2. **Connection Lines**: Visual connections show dependencies and relationships
3. **Status Indicators**: Real-time status (Completed, Running, Failed, Pending)
4. **Conditional Logic**: Switch/condition nodes for dynamic workflows
5. **Workflow Orchestration**: Drag-and-drop to create and visualize workflows

## Proposed Improvements

### Phase 1: Visual Canvas Foundation

#### 1.1 Add Workflow Canvas View
- **New Tab**: "Workflow" tab alongside Overview, Explorer, Costs
- **Canvas Component**: Interactive canvas using a library like `reactflow` or `@xyflow/react`
- **Node Types**:
  - **Resource Nodes**: Represent SST resources (Function, API, Storage, etc.)
  - **Condition Nodes**: Represent conditional logic (Switch, If/Else)
  - **Trigger Nodes**: Represent event triggers (EventBridge, SQS, etc.)
  - **Action Nodes**: Represent actions (Lambda invocations, API calls)

#### 1.2 Resource-to-Node Mapping
- Convert existing resources to visual nodes
- Each node shows:
  - Icon (based on resource type)
  - Name
  - Status badge (Completed/Running/Failed/Pending)
  - Category tag
  - Provider badge (SST/AWS)

### Phase 2: Relationship Visualization

#### 2.1 Dependency Detection
- Parse resource relationships from:
  - `parent` field (parent-child relationships)
  - `outputs` and `inputs` (resource dependencies)
  - URN references (cross-resource links)
  - EventBridge rules (event-driven connections)
  - API Gateway routes (API flow connections)

#### 2.2 Connection Types
- **Parent-Child**: Solid line (hierarchical)
- **Dependency**: Dashed line (resource depends on another)
- **Event Flow**: Colored line (event-driven)
- **Data Flow**: Arrow line (data passing)

### Phase 3: Workflow Orchestration

#### 3.1 Conditional Logic Visualization
- **Switch Nodes**: Show conditional routing (like the image)
  - Example: "If Function succeeds → Route to Storage, else → Route to Error Handler"
- **Condition Builder**: Visual condition editor
- **Branch Visualization**: Multiple paths from a single node

#### 3.2 Workflow Execution Flow
- Show execution order (top to bottom, left to right)
- Highlight active/pending nodes
- Show execution status per node

### Phase 4: Interactive Features

#### 4.1 Drag-and-Drop
- Drag resources from sidebar onto canvas
- Rearrange nodes on canvas
- Connect nodes by dragging from output to input

#### 4.2 Node Configuration
- Click node to open configuration panel
- Edit node properties
- Configure connections

#### 4.3 Workflow Templates
- Pre-built workflow templates
- Common patterns (API → Function → Storage, Event → Function → Queue)

## Implementation Plan

### Step 1: Add React Flow Library
```bash
pnpm add @xyflow/react
```

### Step 2: Create Workflow Canvas Component
- `WorkflowCanvas.tsx`: Main canvas component
- `WorkflowNode.tsx`: Individual node component
- `WorkflowEdge.tsx`: Connection line component

### Step 3: Resource Relationship Parser
- Extend `state-parser.ts` to detect relationships
- Create `relationship-parser.ts` for dependency analysis

### Step 4: Node Type System
- Define node types (Resource, Condition, Trigger, Action)
- Create node renderers for each type

### Step 5: Status System
- Add status tracking (Completed, Running, Failed, Pending)
- Real-time status updates (if possible via WebSocket/SSE)

## Component Architecture

```
apps/tool/src/
├── components/
│   ├── workflow/
│   │   ├── WorkflowCanvas.tsx       # Main canvas
│   │   ├── WorkflowNode.tsx          # Node component
│   │   ├── WorkflowEdge.tsx          # Connection component
│   │   ├── NodeTypes.tsx             # Node type definitions
│   │   ├── ConditionNode.tsx        # Conditional logic node
│   │   ├── TriggerNode.tsx          # Event trigger node
│   │   └── ResourceNode.tsx         # Resource node
│   └── ...
├── lib/
│   ├── relationship-parser.ts       # Parse resource relationships
│   ├── workflow-builder.ts          # Workflow construction logic
│   └── ...
└── types/
    └── workflow.ts                   # Workflow type definitions
```

## Benefits of This Approach

1. **Visual Understanding**: Users can see how resources connect and interact
2. **Workflow Discovery**: Discover hidden relationships and dependencies
3. **Debugging**: Visualize execution flow to debug issues
4. **Documentation**: Self-documenting infrastructure through visual workflows
5. **Planning**: Plan new resources by visualizing where they fit in the workflow

## Challenges to Address

1. **Performance**: Large resource graphs may be slow to render
   - Solution: Virtualization, lazy loading, clustering
2. **Complexity**: Too many connections can be overwhelming
   - Solution: Filtering, grouping, minimap
3. **Layout**: Automatic layout for large graphs
   - Solution: Use layout algorithms (hierarchical, force-directed)

## Next Steps

1. ✅ Create this planning document
2. ⏭️ Implement Phase 1: Visual Canvas Foundation
3. ⏭️ Implement Phase 2: Relationship Visualization
4. ⏭️ Implement Phase 3: Workflow Orchestration
5. ⏭️ Implement Phase 4: Interactive Features

