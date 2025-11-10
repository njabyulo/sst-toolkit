# SST Toolkit - Monorepo Plan

> **A comprehensive toolkit for exploring, visualizing, and extending SST**

## Overview

This document outlines the plan to create `sst-toolkit` - a standalone, open-source monorepo that provides tools for SST developers. The toolkit will include a visual state explorer, plugin system, CLI tools, and extension framework.

## Repository Structure

```
sst-toolkit/
├── apps/
│   ├── explorer/              # Visual SST state explorer (current tool app)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── workflow/   # Workflow builder components
│   │   │   │   ├── resource/   # Resource visualization
│   │   │   │   └── ui/         # UI components
│   │   │   ├── lib/
│   │   │   │   ├── state-parser.ts
│   │   │   │   ├── relationship-parser.ts
│   │   │   │   └── workflow-builder.ts
│   │   │   └── types/
│   │   └── package.json
│   │
│   ├── cli/                    # CLI tool for SST toolkit
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   │   ├── explore.ts  # Explore SST state
│   │   │   │   ├── plugin.ts   # Plugin management
│   │   │   │   └── generate.ts # Generate extensions
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── dev-server/             # Development server for explorer
│       └── package.json
│
├── packages/
│   ├── core/                   # Core toolkit utilities
│   │   ├── src/
│   │   │   ├── state/          # SST state parsing
│   │   │   ├── workflow/       # Workflow building
│   │   │   ├── relationships/  # Relationship detection
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── plugin-sdk/             # Plugin development SDK
│   │   ├── src/
│   │   │   ├── component/      # Component base classes
│   │   │   ├── hooks/          # Plugin hooks
│   │   │   ├── types/          # Plugin types
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── shared/                 # Shared types, utils, schemas, constants
│       ├── src/
│       │   ├── types/          # Type definitions
│       │   ├── utils/          # Utility functions
│       │   ├── schemas/        # Validation schemas
│       │   ├── constants/      # Constants
│       │   └── index.ts
│       └── package.json
│
├── extensions/                 # Example extensions/plugins
│   ├── aws-cost-analyzer/      # AWS cost analysis extension
│   ├── workflow-templates/     # Workflow templates
│   └── custom-components/     # Custom component examples
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   └── release.yml
│   └── ISSUE_TEMPLATE/
│
├── docs/                       # Documentation
│   ├── getting-started.md
│   ├── plugins.md
│   ├── extensions.md
│   └── api/
│
├── package.json                # Root package.json
├── pnpm-workspace.yaml         # pnpm workspace config
├── turbo.json                  # Turborepo config
├── tsconfig.base.json          # Base TypeScript config
├── README.md
├── LICENSE                     # MIT License
└── CONTRIBUTING.md
```

## Naming

### Options Considered

1. **`sst-toolkit`** ✅ (Recommended)
   - **Pros**: Clear, descriptive, professional
   - **Cons**: Slightly generic
   - **Verdict**: Best balance of clarity and professionalism

2. **`sst-devkit`**
   - **Pros**: Emphasizes developer tools
   - **Cons**: Might imply only for development

3. **`sst-studio`**
   - **Pros**: Suggests workspace/IDE-like experience
   - **Cons**: Less clear about purpose

4. **`sst-explorer`**
   - **Pros**: Focuses on exploration
   - **Cons**: Too narrow (we want more than exploration)

5. **`sst-tools`**
   - **Pros**: Simple, clear
   - **Cons**: Very generic

### Final Decision: `sst-toolkit`

**Repository**: `github.com/sst-toolkit/sst-toolkit`  
**npm scope**: `@sst-toolkit/*`

## Package Organization

### 1. Shared Package (`@sst-toolkit/shared`)

**Purpose**: Shared TypeScript types, utilities, schemas, and constants.

**Exports**:
- SST resource types
- Workflow types
- State parsing utilities
- Relationship parsing utilities
- Workflow building utilities
- Schemas (for validation)
- Constants

**Dependencies**: None

```typescript
// Example usage
import type { ISSTResource, IWorkflowNode } from '@sst-toolkit/shared/types/sst';
import { Utils } from '@sst-toolkit/shared';

const state = await loadSSTState();
const resources = Utils.State.parseState(state);
const relationships = Utils.Relationships.parseResourceRelationships(resources);
```

### 2. Core Package (`@sst-toolkit/core`)

**Purpose**: Core utilities for SST state parsing, relationship detection, and workflow building.

**Exports**:
- SST state parsing utilities
- Relationship detection algorithms
- Workflow building logic
- Resource type categorization

**Dependencies**: `@sst-toolkit/shared`

```typescript
// Example usage
import { State, Relationships, Workflow } from '@sst-toolkit/core';

const state = await loadSSTState();
const resources = State.State.parseState(state);
const relationships = Relationships.Relationships.parseResourceRelationships(resources);
```

### 3. Plugin SDK (`@sst-toolkit/plugin-sdk`)

**Purpose**: SDK for creating extensions and plugins.

**Exports**:
- Base classes for plugins
- Plugin hooks and lifecycle
- Type definitions
- Plugin loader utilities

**Dependencies**: `@sst-toolkit/shared`

```typescript
// Example plugin
import { Plugin, IPlugin } from '@sst-toolkit/plugin-sdk';

export class MyPlugin extends Plugin implements IPlugin {
  name = 'my-plugin';
  version = '1.0.0';
  
  hooks = {
    onStateLoad: (state) => {
      // Custom logic
    }
  };
}
```


## Extension System Architecture

### Plugin Types

#### 1. Visual Extensions
- Custom node renderers
- Workflow templates
- Custom visualizations
- Layout algorithms

#### 2. Analysis Extensions
- Cost analyzers
- Security scanners
- Performance analyzers
- Dependency analyzers

#### 3. Component Extensions
- Custom SST components
- Component generators
- Component templates
- Component validators

#### 4. CLI Extensions
- Custom commands
- Code generators
- Migration tools
- Validation tools

### Plugin Interface

```typescript
// packages/plugin-sdk/src/types/plugin.ts
export interface IPlugin {
  name: string;
  version: string;
  description: string;
  author?: string;
  license?: string;
  
  hooks?: {
    onStateLoad?: (state: ISSTState) => void | Promise<void>;
    onNodeRender?: (node: IWorkflowNode) => ReactNode;
    onWorkflowBuild?: (workflow: IWorkflow) => IWorkflow;
    onResourceSelect?: (resource: ISSTResource) => void;
  };
  
  commands?: ICommand[];
  components?: IComponent[];
  analyzers?: IAnalyzer[];
  
  dependencies?: string[];
  peerDependencies?: string[];
}
```

### Plugin Discovery

Plugins can be:
1. **Local**: In `extensions/` directory
2. **npm packages**: Published to npm with `sst-toolkit-plugin` keyword
3. **GitHub**: Loaded from GitHub repositories
4. **URL**: Loaded from remote URLs

### Plugin Registry

```json
{
  "plugins": [
    {
      "name": "@sst-toolkit/aws-cost-analyzer",
      "description": "Analyze AWS costs from SST resources",
      "category": "analysis",
      "author": "sst-toolkit",
      "version": "1.0.0",
      "repository": "https://github.com/sst-toolkit/aws-cost-analyzer"
    }
  ]
}
```

## Migration Plan

### Phase 1: Repository Setup (Week 1)

**Tasks**:
- [ ] Create new repository `sst-toolkit`
- [ ] Set up monorepo structure (pnpm + turbo)
- [ ] Initialize all packages
- [ ] Set up CI/CD workflows
- [ ] Create base configuration files

**Deliverables**:
- Repository structure
- Base package.json files
- Turborepo configuration
- GitHub Actions workflows

### Phase 2: Migrate Tool App (Week 2)

**Tasks**:
- [ ] Move `apps/tool` → `apps/explorer`
- [ ] Extract shared code to packages
- [ ] Update dependencies
- [ ] Test all functionality
- [ ] Update build scripts

**Deliverables**:
- Working explorer app
- Core package with state parsing
- UI package with components
- Types package with definitions

### Phase 3: Plugin System (Week 3)

**Tasks**:
- [ ] Create plugin SDK
- [ ] Build plugin loader
- [ ] Create plugin interface
- [ ] Build example plugins
- [ ] Document plugin system

**Deliverables**:
- Plugin SDK package
- Plugin loader implementation
- Example plugins
- Plugin documentation

### Phase 4: CLI Tool (Week 4)

**Tasks**:
- [ ] Create CLI package
- [ ] Add commands (explore, plugin, generate)
- [ ] Integrate with explorer
- [ ] Add plugin management
- [ ] Test CLI functionality

**Deliverables**:
- CLI package
- Command implementations
- Plugin management
- CLI documentation

### Phase 5: Documentation & Release (Week 5)

**Tasks**:
- [ ] Write comprehensive documentation
- [ ] Create examples and tutorials
- [ ] Set up GitHub Pages/docs site
- [ ] Prepare release notes
- [ ] Release v1.0.0

**Deliverables**:
- Complete documentation
- Example projects
- Documentation site
- v1.0.0 release

## Package.json Structure

### Root package.json

```json
{
  "name": "sst-toolkit",
  "version": "1.0.0",
  "private": true,
  "description": "Toolkit for exploring, visualizing, and extending SST",
  "author": "SST Toolkit Contributors",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/sst-toolkit/sst-toolkit.git"
  },
  "workspaces": [
    "apps/*",
    "packages/*",
    "extensions/*"
  ],
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "lint:fix": "turbo lint:fix",
    "test": "turbo test",
    "test:unit": "turbo test:unit",
    "test:e2e": "turbo test:e2e",
    "clean": "turbo clean",
    "clean:all": "turbo clean:all && rm -rf node_modules .turbo",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,md,json}\""
  },
  "devDependencies": {
    "@eslint/js": "catalog:",
    "@types/node": "catalog:",
    "eslint": "catalog:",
    "prettier": "catalog:",
    "turbo": "catalog:",
    "typescript": "catalog:",
    "typescript-eslint": "catalog:"
  },
  "packageManager": "pnpm@10.20.0",
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=10.0.0"
  }
}
```

### pnpm-workspace.yaml

```yaml
packages:
  - apps/*
  - packages/*
  - extensions/*

catalog:
  '@eslint/js': 9.37.0
  '@types/node': 24.7.1
  '@types/react': ^19
  '@types/react-dom': ^19
  '@vitejs/plugin-react': 5.0.4
  '@xyflow/react': ^12.0.0
  'class-variance-authority': 0.7.1
  'clsx': 2.1.1
  'eslint': 9.37.0
  'lucide-react': 0.545.0
  'prettier': 3.6.2
  'react': 19.1.0
  'react-dom': 19.1.0
  'tailwind-merge': 3.3.1
  'tailwindcss': ^4
  'turbo': 2.6.0
  'typescript': 5.9.3
  'typescript-eslint': 8.46.0
  'vite': 7.1.7
```

## Key Features

### 1. Visual Explorer

**Features**:
- Workflow builder with drag-and-drop
- Resource visualization with status indicators
- Relationship mapping with connection lines
- Real-time status tracking
- Export workflows as images

**Technology**:
- React Flow for canvas
- React for UI
- TypeScript for type safety

### 2. Plugin System

**Features**:
- Easy plugin creation with SDK
- Plugin marketplace/discovery
- Multiple extension points
- Type-safe plugin APIs
- Hot reload for development

**Technology**:
- Plugin SDK package
- Plugin loader
- Plugin registry

### 3. CLI Tool

**Features**:
- Explore SST state from command line
- Generate extensions and plugins
- Plugin management (install, list, remove)
- Code generation for common patterns
- Integration with explorer app

**Technology**:
- Commander.js for CLI
- Node.js for runtime

### 4. Developer Experience

**Features**:
- Full TypeScript support
- Hot reload in development
- Comprehensive documentation
- Example projects
- GitHub templates

**Technology**:
- TypeScript strict mode
- Vite for dev server
- Vitest for testing

## Dependencies

### Core Dependencies

- **React Flow** (`@xyflow/react`): Workflow canvas
- **React**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Turborepo**: Monorepo build system
- **pnpm**: Package manager

### UI Dependencies

- **Radix UI**: Accessible components
- **Tailwind CSS**: Styling
- **Lucide React**: Icons
- **Recharts**: Charts and graphs

### Development Dependencies

- **ESLint**: Linting
- **Prettier**: Code formatting
- **Vitest**: Testing
- **TypeScript**: Type checking

## Documentation Structure

```
docs/
├── getting-started.md          # Quick start guide
├── installation.md             # Installation instructions
├── explorer/
│   ├── overview.md            # Explorer overview
│   ├── workflow-builder.md     # Workflow builder guide
│   └── resource-visualization.md
├── plugins/
│   ├── creating-plugins.md    # Plugin creation guide
│   ├── plugin-api.md          # Plugin API reference
│   └── examples.md            # Plugin examples
├── extensions/
│   ├── extension-types.md     # Types of extensions
│   ├── creating-extensions.md  # Extension creation
│   └── examples.md            # Extension examples
├── cli/
│   ├── commands.md             # CLI commands
│   └── usage.md               # CLI usage guide
└── api/
    ├── core.md                # Core API
    ├── plugin-sdk.md          # Plugin SDK API
    └── ui.md                  # UI components API
```

## License

**MIT License** - Open source, free to use and modify.

## Contributing

See `CONTRIBUTING.md` for guidelines on:
- Code style
- Pull request process
- Issue reporting
- Plugin submission
- Documentation contributions

## Roadmap

### v1.0.0 (Initial Release)
- [x] Visual explorer with workflow builder
- [x] Core state parsing utilities
- [x] Plugin SDK foundation
- [x] Basic CLI tool
- [x] Documentation

### v1.1.0 (Plugin System)
- [ ] Plugin marketplace
- [ ] Plugin registry
- [ ] Plugin templates
- [ ] Plugin validation

### v1.2.0 (Advanced Features)
- [ ] Real-time state updates
- [ ] Collaborative editing
- [ ] Workflow templates
- [ ] Export/import workflows

### v2.0.0 (Extension Framework)
- [ ] Full extension system
- [ ] Extension marketplace
- [ ] Extension builder UI
- [ ] Extension validation

## Success Metrics

### Adoption
- GitHub stars
- npm downloads
- Plugin submissions
- Community contributions

### Quality
- Test coverage
- Documentation completeness
- Issue resolution time
- User satisfaction

## Next Steps

1. **Review this plan** with stakeholders
2. **Create repository** structure
3. **Set up monorepo** configuration
4. **Migrate tool app** to explorer
5. **Build plugin SDK** foundation
6. **Create documentation** site
7. **Release v1.0.0**

## Questions & Feedback

For questions or feedback about this plan:
- Open an issue on GitHub
- Start a discussion
- Contact maintainers

---

**Let's build the SST toolkit ecosystem together! 🚀**

