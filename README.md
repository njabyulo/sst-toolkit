# SST Toolkit

> **A comprehensive toolkit for exploring, visualizing, and extending SST**

## Overview

SST Toolkit is a monorepo containing tools and utilities for working with SST (Serverless Stack). It includes:

- **Explorer**: Visual SST state explorer with workflow builder
- **CLI**: Command-line tools for SST state exploration
- **Core**: Core utilities for state parsing, relationship detection, and workflow building
- **Shared**: Shared types, utilities, schemas, and constants
- **Plugin SDK**: SDK for creating extensions and plugins

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

## License

MIT

