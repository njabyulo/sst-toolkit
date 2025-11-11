# Getting Started with SST Toolkit

This guide will help you get started with SST Toolkit quickly.

## What is SST Toolkit?

SST Toolkit is a comprehensive toolkit for exploring, visualizing, and extending SST (Serverless Stack). It provides:

- **Explorer**: Visual SST state explorer with workflow builder
- **CLI**: Command-line tools for SST state exploration
- **Core Utilities**: State parsing, relationship detection, and workflow building
- **Plugin SDK**: SDK for creating custom SST components

## Installation

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 10.0.0
- SST >= 3.0.0

### Install SST Toolkit

```bash
# Clone the repository
git clone https://github.com/sst-toolkit/sst-toolkit.git
cd sst-toolkit

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

## Quick Start

### 1. Explore Your SST State

#### Using the CLI

```bash
# First, export your SST state (from your SST project directory)
npx sst state export --stage dev > state.json

# Then explore it
pnpm sst-toolkit explore state.json
```

#### Using the Explorer Web App

1. **Export your SST state** from your SST project:
   ```bash
   # From your SST project directory
   npx sst state export --stage dev > /path/to/sst-toolkit/apps/explorer/public/misc/state.json
   
   # Example:
   npx sst state export --stage dev > ~/Documents/development/playground/oss/sst-toolkit/apps/explorer/public/misc/state.json
   ```

2. **Start the Explorer**:
   ```bash
   cd apps/explorer
   pnpm dev
   # Open http://localhost:5173
   ```

The Explorer will automatically load the state file from `public/misc/state.json`.

### 2. Create Your First Component

```bash
# Generate a new component
pnpm sst-toolkit plugin create MyComponent --template basic --namespace mycompany
```

This creates a complete component structure ready for development.

### 3. Use Your Component

```typescript
// sst.config.ts
import { MyComponent } from "@mycompany/my-component";

export default {
  stacks(app) {
    app.stack(function MyStack({ stack }) {
      const component = new MyComponent("MyComponent", {
        // ... props
      });

      stack.addOutputs({
        output: component.output,
      });
    });
  },
};
```

## Next Steps

- **[Creating Components](./guides/creating-components.md)** - Learn how to create custom components
- **[Using Components](./guides/using-components.md)** - Learn how to use components in your projects
- **[Exploring Infrastructure](./guides/exploring-infrastructure.md)** - Use the CLI and Explorer
- **[Component Examples](./examples/components.md)** - See real-world examples

## Architecture Overview

SST Toolkit follows a modular architecture:

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

## Key Concepts

### Components vs Plugins

In SST Toolkit, **components** and **plugins** refer to the same thing: custom SST components that extend SST's capabilities. The terms are used interchangeably.

### Pulumi Type Format

All components must use the format: `sst:namespace:Type`

- `sst:` - Required prefix for SST components
- `namespace` - Your company/org name (lowercase, alphanumeric + hyphens)
- `Type` - Component type (PascalCase)

Examples:
- `sst:mycompany:MyComponent`
- `sst:acme:Database`
- `sst:example:ApiGateway`

### Component Structure

A component typically includes:

- Component class extending `SSTComponent`
- Props interface
- Implementation with child resources
- Link properties for SST Link integration
- Outputs registration

## Common Commands

```bash
# Build all packages
pnpm build

# Run tests
pnpm test

# Run linter
pnpm lint

# Create a new component
pnpm sst-toolkit plugin create MyComponent --template basic --namespace mycompany

# Explore SST state
pnpm sst-toolkit explore .sst/state.json

# Visualize workflow
pnpm sst-toolkit visualize .sst/state.json --format json --output workflow.json
```

## Getting Help

- **[Documentation Index](./README.md)** - Browse all documentation
- **[API Reference](./API.md)** - Complete API documentation
- **[Examples](./examples/)** - Real-world examples
- **[Best Practices](./guides/best-practices.md)** - Development guidelines

## What's Next?

Now that you're set up, check out:

1. **[Creating Components](./guides/creating-components.md)** - Create your first component
2. **[Component Examples](./examples/components.md)** - See what's possible
3. **[Using Components](./guides/using-components.md)** - Integrate components in your projects

