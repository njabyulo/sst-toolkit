# SST Toolkit

<div align="center">

> **A comprehensive toolkit for exploring, visualizing, and extending SST**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![pnpm Version](https://img.shields.io/badge/pnpm-%3E%3D10.0.0-orange)](https://pnpm.io/)

</div>

## Overview

SST Toolkit is a monorepo containing tools and utilities for working with SST (Serverless Stack). It provides:

- **Explorer**: Visual web application for exploring and visualizing SST infrastructure state
- **CLI**: Command-line tools for finding AWS resources and generating SST components
- **Core**: Core utilities for state parsing, relationship detection, and workflow building
- **Shared**: Shared types, utilities, schemas, and constants
- **Plugin SDK**: SDK for creating custom SST components and adapters

## Quick Start

### Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 10.0.0

### Installation

```bash
# Clone the repository
git clone https://github.com/sst-toolkit/sst-toolkit.git
cd sst-toolkit

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Using the CLI

```bash
# Build the CLI
cd apps/cli
pnpm build

# Find AWS resources by tags
./dist/index.js resources find --tag sst:stage dev --tag sst:app myapp

# Generate a new component
./dist/index.js generate component MyComponent --template aws --namespace mycompany

# Generate a new adapter
./dist/index.js generate adapter MyAdapter --namespace mycompany
```

### Using the Explorer

```bash
# Start the Explorer
cd apps/explorer
pnpm dev

# Open http://localhost:5173 in your browser
# Upload your SST state file using the upload button
```

## Architecture

SST Toolkit follows a modular architecture designed for extensibility:

```
sst-toolkit/
├── packages/
│   ├── core/          # Core utilities (state, relationships, workflow, adapters)
│   ├── shared/        # Shared types, schemas, constants
│   └── plugin-sdk/    # SDK for creating plugins and components
├── apps/
│   ├── explorer/      # Visual SST state explorer (React app)
│   └── cli/           # Command-line interface
└── examples/          # Example components and plugins
```

### Core Principles

1. **Extensibility**: Built on adapter pattern to extend SST without modifying core
2. **Type Safety**: Full TypeScript support with shared types
3. **Modularity**: Each package is independently usable
4. **Developer Experience**: CLI tools and SDK for rapid development

## Packages

### `@sst-toolkit/core`

Core utilities for SST state parsing, relationship detection, and workflow building.

```typescript
import * as State from "@sst-toolkit/core/state";
import * as Relationships from "@sst-toolkit/core/relationships";
import * as Workflow from "@sst-toolkit/core/workflow";

// Parse SST state
const nodes = State.parseState(state);

// Detect relationships
const relationships = Relationships.parseResourceRelationships(resources);

// Build workflow
const workflow = Workflow.buildWorkflow(resources, relationships);
```

### `@sst-toolkit/shared`

Shared TypeScript types, utilities, schemas, and constants.

```typescript
import type { ISSTResource, ISSTState, IWorkflowNode } from "@sst-toolkit/shared/types/sst";
```

### `@sst-toolkit/plugin-sdk`

SDK for creating custom SST components and adapters.

```typescript
import * as Component from "@sst-toolkit/plugin-sdk/component";
import * as Generator from "@sst-toolkit/plugin-sdk/generator";
import * as Templates from "@sst-toolkit/plugin-sdk/templates";
```

## Apps

### Explorer

Visual web application for exploring and analyzing SST infrastructure state.

**Features:**
- 📤 **File Upload**: Upload and visualize SST state files directly in the browser
- 🔍 **Resource Explorer**: Browse resources in a tree view with search functionality
- 📊 **Workflow Visualization**: Interactive graph showing resource relationships and dependencies
- ⏳ **Pending Operations**: View and manage pending operations (create, update, delete, replace)
- 🔎 **Global Search**: Quick search across all resources by name, type, URN, or category

**Getting Started:**

1. Export your SST state:
   ```bash
   npx sst state export --stage dev > state.json
   ```

2. Start the Explorer:
   ```bash
   cd apps/explorer
   pnpm dev
   ```

3. Open http://localhost:5173 and upload your `state.json` file

**Usage:**
- Upload a state file using the upload button
- Browse resources in the Explorer tab
- View pending operations in the Pending tab (if any)
- Visualize relationships in the Workflow tab
- Use global search (⌘K / Ctrl+K) to quickly find resources

### CLI

Command-line tools for managing AWS resources and generating SST components.

**Available Commands:**

#### Find Resources

Find AWS resources by tags:

```bash
sst-toolkit resources find \
  --tag sst:stage dev \
  --tag sst:app myapp \
  --tagMatch AND \
  --region us-east-1 \
  --profile myprofile
```

**Options:**
- `--tag KEY VALUE`: Tag filter (can be used multiple times)
- `--tagMatch <AND|OR>`: Tag matching logic (default: AND)
- `--region <region>`: AWS region (default: us-east-1)
- `--profile <profile>`: AWS profile (default: default)

#### Delete Resources

Delete AWS resources by tags:

```bash
sst-toolkit resources delete \
  --tag sst:stage dev \
  --tag sst:app myapp \
  --dry-run \
  --force
```

**Options:**
- `--tag KEY VALUE`: Tag filter (can be used multiple times)
- `--tagMatch <AND|OR>`: Tag matching logic (default: AND)
- `--region <region>`: AWS region
- `--profile <profile>`: AWS profile
- `--dry-run`: Preview changes without deleting
- `--force, -f`: Skip confirmation prompts

#### Generate Component

Generate a new SST component from a template:

```bash
sst-toolkit generate component MyComponent \
  --template aws \
  --namespace mycompany \
  --output ./my-components
```

**Options:**
- `<name>`: Component name (e.g., MyComponent)
- `-t, --template <template>`: Template to use (basic, aws, cloudflare) (default: basic)
- `-n, --namespace <namespace>`: Namespace for the component (default: example)
- `-o, --output <dir>`: Output directory (default: current directory)

**Templates:**
- `basic`: Minimal component template
- `aws`: AWS-focused template with Function, API Gateway, and DynamoDB
- `cloudflare`: Cloudflare-focused template with Worker, KV, and D1

#### Generate Adapter

Generate a new SST adapter:

```bash
sst-toolkit generate adapter MyAdapter \
  --namespace mycompany \
  --output ./my-adapters
```

**Options:**
- `<name>`: Adapter name (e.g., MyAdapter)
- `-n, --namespace <namespace>`: Namespace for the adapter (default: example)
- `-o, --output <dir>`: Output directory (default: current directory)

## Creating Custom Components

SST Toolkit makes it easy to create custom SST components. Use the CLI to generate a new component:

```bash
# Create a basic component
sst-toolkit generate component MyComponent --template basic --namespace mycompany

# Create an AWS-focused component
sst-toolkit generate component MyAPI --template aws --namespace mycompany

# Create a Cloudflare-focused component
sst-toolkit generate component MyWorker --template cloudflare --namespace mycompany
```

This generates a complete component structure with:
- Component class extending `SSTComponent`
- TypeScript configuration
- Build scripts (tsup)
- Module augmentation for global types
- Package.json with proper dependencies

### Component Structure

Generated components follow this structure:

```typescript
import * as Component from "@sst-toolkit/plugin-sdk/component";
import type { ComponentResourceOptions } from "@pulumi/pulumi";

export interface IMyComponentProps {
  // Your props here
}

export class MyComponent extends Component.Component.SSTComponent {
  constructor(
    name: string,
    props: IMyComponentProps = {},
    opts?: ComponentResourceOptions
  ) {
    super("sst:mycompany:MyComponent", name, props, opts);

    this.registerOutputs({
      // Your outputs here
    });
  }

  protected getLinkProperties(): Record<string, unknown> {
    return {
      // Link properties for SST Link
    };
  }
}
```

The `SSTComponent` class:
- Extends Pulumi's `ComponentResource`
- Implements SST's `Link.Linkable` interface
- Validates Pulumi type format (`sst:namespace:Type`)
- Provides type-safe component creation

## Development

### Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @sst-toolkit/core build
pnpm --filter @sst-toolkit/cli build
pnpm --filter @sst-toolkit/explorer build
```

### Development Mode

```bash
# Start all apps in development mode
pnpm dev

# Start specific app
pnpm --filter @sst-toolkit/explorer dev
```

### Linting

```bash
# Lint all packages
pnpm lint

# Lint code only
pnpm lint:code

# Lint types only
pnpm lint:type

# Fix linting issues
pnpm lint:fix
```

### Testing

```bash
# Run all tests
pnpm test

# Run unit tests
pnpm test:unit

# Run e2e tests
pnpm test:e2e
```

### Formatting

```bash
# Format all files
pnpm format

# Check formatting
pnpm format:check
```

## Examples

### Using Core Utilities

```typescript
import * as State from "@sst-toolkit/core/state";
import * as Relationships from "@sst-toolkit/core/relationships";
import * as Workflow from "@sst-toolkit/core/workflow";
import type { ISSTState } from "@sst-toolkit/shared/types/sst";

// Load and parse SST state
const state: ISSTState = await loadState();
const nodes = State.parseState(state);

// Detect relationships between resources
const relationships = Relationships.parseResourceRelationships(state.latest.resources);

// Build workflow graph
const workflow = Workflow.buildWorkflow(state.latest.resources, relationships);
```

### Creating a Custom Component

```typescript
import * as Component from "@sst-toolkit/plugin-sdk/component";
import { Function } from "sst/components/function";
import type { ComponentResourceOptions } from "@pulumi/pulumi";

export interface IMyAPIProps {
  handler: string;
}

export class MyAPI extends Component.Component.SSTComponent {
  private fn: Function;

  constructor(
    name: string,
    props: IMyAPIProps,
    opts?: ComponentResourceOptions
  ) {
    super("sst:mycompany:MyAPI", name, props, opts);

    this.fn = new Function(`${name}Function`, {
      handler: props.handler,
    }, { parent: this });

    this.registerOutputs({
      url: this.fn.url,
    });
  }

  protected getLinkProperties(): Record<string, unknown> {
    return {
      url: this.fn.url,
    };
  }
}
```

## Documentation

- [Documentation Index](./docs/README.md) - Browse all documentation
- [Getting Started](./docs/GETTING_STARTED.md) - Quick start guide
- [Creating Components](./docs/guides/creating-components.md) - Component creation guide
- [Using Components](./docs/guides/using-components.md) - Component usage guide
- [Exploring Infrastructure](./docs/guides/exploring-infrastructure.md) - CLI and Explorer guide
- [API Reference](./docs/API.md) - Complete API documentation
- [Examples](./docs/examples/) - Real-world examples

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Security Policy](./SECURITY.md)
- [Changelog](./CHANGELOG.md)

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Acknowledgments

- Built for the [SST](https://sst.dev) community
- Inspired by the need for better infrastructure visualization and extensibility
