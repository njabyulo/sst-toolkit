# SST Toolkit

<div align="center">

> **A comprehensive toolkit for exploring, visualizing, and extending SST**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![pnpm Version](https://img.shields.io/badge/pnpm-%3E%3D10.0.0-orange)](https://pnpm.io/)

</div>

## Overview

SST Toolkit is a monorepo containing tools and utilities for working with SST (Serverless Stack). It includes:

- **Explorer**: Visual SST state explorer with workflow builder
- **CLI**: Command-line tools for SST state exploration
- **Core**: Core utilities for state parsing, relationship detection, and workflow building
- **Shared**: Shared types, utilities, schemas, and constants
- **Plugin SDK**: SDK for creating extensions and plugins

## Architecture

SST Toolkit follows a modular architecture designed for extensibility:

```
sst-toolkit/
├── packages/
│   ├── core/          # Core utilities (state, relationships, workflow, adapters)
│   ├── shared/        # Shared types, schemas, constants
│   └── plugin-sdk/    # SDK for creating plugins and components
├── apps/
│   ├── explorer/      # Visual SST state explorer
│   └── cli/           # Command-line interface
└── examples/          # Example components and plugins
```

### Core Principles

1. **Extensibility**: Built on adapter pattern to extend SST without modifying core
2. **Type Safety**: Full TypeScript support with shared types
3. **Modularity**: Each package is independently usable
4. **Developer Experience**: CLI tools and SDK for rapid development

## Getting Started

### Installation

```bash
pnpm install
```

### Development

```bash
# Start all apps in development mode
pnpm dev

# Start specific app
pnpm --filter @sst-toolkit/explorer dev
```

### Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @sst-toolkit/core build
```

## Packages

### `@sst-toolkit/core`

Core utilities for SST state parsing, relationship detection, and workflow building.

```typescript
import { parseState, parseResourceRelationships, buildWorkflow } from '@sst-toolkit/core';
```

### `@sst-toolkit/shared`

Shared TypeScript types, utilities, schemas, and constants.

```typescript
import type { ISSTResource, IWorkflowNode } from '@sst-toolkit/shared/types/sst';
import { Utils } from '@sst-toolkit/shared';
```

### `@sst-toolkit/plugin-sdk`

SDK for creating plugins and extensions.

```typescript
import { IPlugin } from '@sst-toolkit/plugin-sdk';
```

## Apps

### Explorer

Visual SST state explorer with workflow builder.

```bash
cd apps/explorer
pnpm dev
```

### CLI

Command-line tools for SST state exploration.

```bash
cd apps/cli
pnpm build
pnpm sst-toolkit explore <state-file>
```

## Plugin Creation Guide

SST Toolkit makes it easy to create custom SST components as plugins. Use the CLI to generate a new plugin:

```bash
# Create a basic plugin component
pnpm sst-toolkit plugin create MyComponent --template basic --namespace mycompany

# Create an AWS-focused plugin
pnpm sst-toolkit plugin create MyAWSComponent --template aws --namespace mycompany

# Create a Cloudflare-focused plugin
pnpm sst-toolkit plugin create MyCloudflareComponent --template cloudflare --namespace mycompany
```

This generates a complete plugin structure with:
- Component class extending `SSTComponent`
- TypeScript configuration
- Build scripts
- Module augmentation for global types

See [Plugin Development Guide](./docs/plugins/creating-plugins.md) for detailed instructions.

## Component Extension Guide

To extend SST with custom components, use the `SSTComponent` base class from `@sst-toolkit/plugin-sdk`:

```typescript
import * as Component from "@sst-toolkit/plugin-sdk/component";
import type { ComponentResourceOptions } from "@pulumi/pulumi";

export interface IMyComponentProps {
  message?: string;
}

export class MyComponent extends Component.Component.SSTComponent {
  constructor(
    name: string,
    props: IMyComponentProps = {},
    opts?: ComponentResourceOptions
  ) {
    super("sst:mycompany:MyComponent", name, props, opts);

    this.registerOutputs({
      message: props.message || "Hello from MyComponent!",
    });
  }

  protected getLinkProperties(): Record<string, unknown> {
    return {
      message: "Hello from MyComponent!",
    };
  }
}
```

The `SSTComponent` class:
- Extends Pulumi's `ComponentResource`
- Implements SST's `Link.Linkable` interface
- Validates Pulumi type format (`sst:namespace:Type`)
- Provides type-safe component creation

See [Component Development Guide](./docs/components/creating-components.md) for detailed instructions.

## Examples

### Using the CLI

```bash
# Explore SST state
pnpm sst-toolkit explore ./state.json

# Visualize workflow
pnpm sst-toolkit visualize ./state.json --format json --output workflow.json

# Create a new plugin
pnpm sst-toolkit plugin create MyPlugin --template basic --namespace mycompany

# List installed plugins
pnpm sst-toolkit plugin list

# Install a plugin
pnpm sst-toolkit plugin install @mycompany/my-plugin
```

### Using Core Utilities

```typescript
import * as State from "@sst-toolkit/core/state";
import * as Relationships from "@sst-toolkit/core/relationships";
import * as Workflow from "@sst-toolkit/core/workflow";
import type { ISSTState } from "@sst-toolkit/shared/types/sst";

// Parse SST state
const state: ISSTState = await loadState();
const nodes = State.parseState(state);

// Detect relationships
const relationships = Relationships.parseResourceRelationships(state.latest.resources);

// Build workflow
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



