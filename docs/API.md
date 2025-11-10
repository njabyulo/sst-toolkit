# API Documentation

Complete API reference for SST Toolkit.

## Core APIs

### State Parsing

#### `parseState(state: ISSTState): IResourceNode[]`

Parses SST state and returns resource nodes.

**Parameters:**
- `state` (ISSTState): SST state object

**Returns:** Array of resource nodes

**Example:**
```typescript
import * as State from "@sst-toolkit/core/state";
import type { ISSTState } from "@sst-toolkit/shared/types/sst";

const nodes = State.parseState(state);
```

#### `getResourceName(resource: ISSTResource): string`

Extracts resource name from URN.

**Parameters:**
- `resource` (ISSTResource): SST resource

**Returns:** Resource name

#### `getResourceTypeCategory(type: string, resource: ISSTResource): string`

Gets resource type category.

**Parameters:**
- `type` (string): Resource type
- `resource` (ISSTResource): SST resource

**Returns:** Category string

### Relationship Detection

#### `parseResourceRelationships(resources: ISSTResource[]): IWorkflowEdge[]`

Detects relationships between resources.

**Parameters:**
- `resources` (ISSTResource[]): Array of SST resources

**Returns:** Array of workflow edges

**Example:**
```typescript
import * as Relationships from "@sst-toolkit/core/relationships";

const edges = Relationships.parseResourceRelationships(resources);
```

### Workflow Building

#### `buildWorkflow(resources: ISSTResource[], relationships: IWorkflowEdge[]): IWorkflow`

Builds workflow from resources and relationships.

**Parameters:**
- `resources` (ISSTResource[]): Array of SST resources
- `relationships` (IWorkflowEdge[]): Array of workflow edges

**Returns:** Workflow object with nodes and edges

**Example:**
```typescript
import * as Workflow from "@sst-toolkit/core/workflow";

const workflow = Workflow.buildWorkflow(resources, relationships);
```

## Adapter APIs

### ComponentAdapter

Base class for Pulumi components.

#### Constructor

```typescript
constructor(
  pulumiType: string,
  name: string,
  args?: Inputs,
  opts?: ComponentResourceOptions
)
```

**Parameters:**
- `pulumiType` (string): Pulumi type
- `name` (string): Resource name
- `args` (Inputs, optional): Component inputs
- `opts` (ComponentResourceOptions, optional): Pulumi options

### Validation

#### `validatePulumiType(pulumiType: string): boolean`

Validates Pulumi type format.

**Parameters:**
- `pulumiType` (string): Type to validate

**Returns:** `true` if valid

**Throws:** Error if invalid

**Example:**
```typescript
import * as Validator from "@sst-toolkit/core/adapters";

Validator.validatePulumiType("sst:mycompany:MyComponent");
```

#### `validateComponent(component: ComponentResource, options?): boolean`

Validates a component.

**Parameters:**
- `component` (ComponentResource): Component to validate
- `options` (object, optional): Validation options
  - `checkPulumiType?: boolean`
  - `checkParent?: boolean`
  - `checkOutputs?: boolean`
  - `checkLinkable?: boolean`

**Returns:** `true` if valid

**Throws:** Error if invalid

## Plugin SDK APIs

### SSTComponent

Base class for SST components.

#### Constructor

```typescript
constructor(
  pulumiType: string,
  name: string,
  args?: Inputs,
  opts?: ComponentResourceOptions
)
```

#### Methods

##### `getSSTLink(): ILinkDefinition`

Returns SST Link definition.

**Returns:**
```typescript
{
  properties: Record<string, unknown>
}
```

##### `protected abstract getLinkProperties(): Record<string, unknown>`

Abstract method to return link properties.

**Returns:** Object with link properties

### Generator APIs

#### `generateComponent(options): string`

Generates component code from template.

**Parameters:**
- `options.componentName` (string): Component name
- `options.namespace` (string): Namespace
- `options.template` (string): Template string

**Returns:** Generated code

#### `generateModuleAugmentation(options): string`

Generates module augmentation code.

**Parameters:**
- `options.componentName` (string): Component name
- `options.namespace` (string): Namespace

**Returns:** Generated code

#### `generatePackageJson(options): string`

Generates package.json content.

**Parameters:**
- `options.packageName` (string): Package name
- `options.version?: string`: Version
- `options.description?: string`: Description
- `options.author?: string`: Author
- `options.license?: string`: License

**Returns:** JSON string

#### `generateTsConfig(options?): string`

Generates tsconfig.json content.

**Parameters:**
- `options.moduleAugmentationPath?: string`: Module augmentation path

**Returns:** JSON string

#### `generateTsupConfig(options): string`

Generates tsup.config.ts content.

**Parameters:**
- `options.entryFile` (string): Entry file path

**Returns:** Generated code

### Template APIs

Pre-built templates available:

- `Templates.Basic.Basic` - Basic component template
- `Templates.AWS.AWS` - AWS-focused template
- `Templates.Cloudflare.Cloudflare` - Cloudflare-focused template

**Example:**
```typescript
import * as Templates from "@sst-toolkit/plugin-sdk/templates";

const template = Templates.Basic.Basic;
```

## Type Definitions

### ISSTState

```typescript
interface ISSTState {
  stack: string;
  latest: {
    manifest: {
      version: string;
      time: number;
    };
    resources: ISSTResource[];
  };
}
```

### ISSTResource

```typescript
interface ISSTResource {
  urn: string;
  type: string;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  parent?: string;
  custom?: boolean;
}
```

### IWorkflowNode

```typescript
interface IWorkflowNode {
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
```

### IWorkflowEdge

```typescript
interface IWorkflowEdge {
  id: string;
  source: string;
  target: string;
  type: TWorkflowEdgeType;
  label?: string;
}
```

### IWorkflow

```typescript
interface IWorkflow {
  nodes: IWorkflowNode[];
  edges: IWorkflowEdge[];
}
```

