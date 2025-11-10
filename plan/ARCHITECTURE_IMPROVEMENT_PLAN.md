# SST Toolkit - Architecture Improvement Plan

> **A 3rd party toolkit for SST that works like adapters, not modifications**

## Executive Summary

This document challenges the current architecture and proposes a better approach based on:
1. **Adapter Pattern** (like BetterAuth) - Extend SST without modifying it (NEW capability)
2. **3rd Party Independence** - No dependency on SST core team approval
3. **Plugin Ecosystem** - Enable community to build SST components as plugins (NEW capability)
4. **Visualization Tools** - Provide tools to explore and understand SST infrastructure (EXISTING - maintain and enhance)

**Key Principle**: The toolkit serves TWO complementary purposes:
- **Extend SST** - Help users create SST components as plugins (adapter pattern) - NEW
- **Explore SST** - Visualize and understand SST infrastructure (current focus) - EXISTING, maintain and enhance

**Both capabilities work together**: Create components → Visualize them in explorer

**Research Confirmed**: SST CAN be extended! See [SST_EXTENSIBILITY_RESEARCH.md](./SST_EXTENSIBILITY_RESEARCH.md) for detailed findings. The SST codebase already demonstrates this pattern with the `@sst/aws-bedrock` plugin.

## The Problem with Current Approach

### Current Architecture Issues

1. **Incomplete Feature Set**
   - Current: Toolkit focuses on visualization/exploration ✅
   - Problem: Doesn't ALSO help users extend SST functionality
   - Missing: Component creation, plugin system for SST components
   - **Solution**: Keep visualization/exploration AND add adapter pattern capabilities

2. **Not Following Adapter Pattern**
   - Current: Standalone toolkit that reads SST state (visualization only)
   - Better: Adapter pattern that extends SST like BetterAuth adapters (in addition to visualization)
   - Missing: Integration with SST's component system
   - **Solution**: Add adapter layer while maintaining visualization tools

3. **Duplicate Code**
   - Current: Code duplicated between `packages/core`, `packages/shared`, and `apps/explorer`
   - Problem: Maintenance burden, inconsistency
   - Solution: Single source of truth

4. **No Plugin System for SST Components**
   - Current: Plugin SDK exists but doesn't help create SST components
   - Missing: Tools to create, test, and publish SST component plugins
   - Need: Component generator, plugin templates, validation

## The Better Approach: Adapter Pattern

### Inspiration: BetterAuth Adapters

BetterAuth works by:
1. **Core Framework** - Provides base functionality
2. **Adapters** - Extend functionality without modifying core
3. **Plugin System** - Community builds adapters as npm packages
4. **Type Safety** - Full TypeScript support with module augmentation

### SST Toolkit Should Work Similarly

```
SST (Core)
  ↓
@sst-toolkit/core (Adapter Layer + Utilities)
  ├── Adapter utilities (extend SST)
  ├── State parsing (visualization)
  └── Relationship detection (visualization)
  ↓
├── @sst-toolkit/plugins/* (Community Plugins - extend SST)
└── @sst-toolkit/explorer (Visualization Tools - explore SST)
```

**Key Insight**: The toolkit should do BOTH:
1. **Extend SST** - Help users create SST components as plugins (adapter pattern)
2. **Explore SST** - Visualize and understand SST infrastructure (current focus)

## Proposed Architecture

### 1. Core Adapter Layer (`@sst-toolkit/core`)

**Purpose**: Bridge between SST and toolkit, provides adapter utilities

**Key Features**:
- SST component extension utilities
- Plugin loader for SST components
- Type augmentation helpers
- Component validation

**Structure**:
```
packages/core/
├── src/
│   ├── adapters/          # Adapter utilities
│   │   ├── component.ts   # ComponentAdapter base class
│   │   │                   # - Extends SST's Component
│   │   │                   # - Handles Pulumi type setting
│   │   │                   # - Sets __pulumiType static property
│   │   ├── loader.ts      # Plugin loader (future)
│   │   └── validator.ts   # Component validator
│   │                       # - Validates Pulumi type format
│   │                       # - Checks parent is set
│   │                       # - Verifies outputs registered
│   │                       # - Validates Link.Linkable
│   ├── state/             # State parsing (moved from shared)
│   ├── relationships/      # Relationship detection
│   └── index.ts
```

**Example Usage**:
```typescript
import { ComponentAdapter } from '@sst-toolkit/core/adapters/component';
import type { ComponentResourceOptions } from '@pulumi/pulumi';

export class MyComponent extends ComponentAdapter {
  constructor(
    name: string,
    args: MyComponentArgs,
    opts?: ComponentResourceOptions
  ) {
    // IMPORTANT: Set Pulumi type format: "sst:namespace:Type"
    super("sst:aws:MyComponent", name, args, opts);
    
    // Create underlying resources with { parent: this }
    const resource = new SomeResource(
      `${name}Resource`,
      { /* config */ },
      { parent: this } // IMPORTANT: Set parent
    );
    
    // IMPORTANT: Register outputs
    this.registerOutputs({
      _hint: resource.id,
    });
  }
}
```

**Key Requirements** (from research):
1. ✅ Extends `Component` from `sst/components/component`
2. ✅ Sets Pulumi type: `super("sst:namespace:Type", ...)`
3. ✅ Sets static `__pulumiType` property (handled by ComponentAdapter)
4. ✅ Sets parent for child resources: `{ parent: this }`
5. ✅ Registers outputs: `this.registerOutputs({ ... })`
6. ✅ Implements `Link.Linkable` if linkable: `getSSTLink()`

### 2. Plugin SDK (`@sst-toolkit/plugin-sdk`)

**Purpose**: SDK for creating SST component plugins

**Key Features**:
- `SSTComponent` base class (handles all SST requirements)
- Component templates (AWS, Cloudflare, basic)
- Plugin generator CLI
- Module augmentation helpers
- Testing utilities
- Publishing helpers
- Validation utilities

**Structure**:
```
packages/plugin-sdk/
├── src/
│   ├── component/
│   │   ├── sst-component.ts  # SSTComponent base class
│   │   └── index.ts
│   ├── templates/            # Component templates
│   │   ├── aws.ts
│   │   ├── cloudflare.ts
│   │   └── basic.ts
│   ├── generator/             # Code generator
│   │   ├── component-generator.ts
│   │   ├── module-augmentation.ts
│   │   └── package-generator.ts
│   ├── test-utils/            # Testing utilities
│   └── index.ts
```

**Example Usage**:
```typescript
// Using SSTComponent base class
import { SSTComponent } from '@sst-toolkit/plugin-sdk/component';
import type { ComponentResourceOptions } from '@pulumi/pulumi';
import type { Input } from 'sst/components/input';

export interface MyComponentArgs {
  // Component arguments
}

export class MyComponent extends SSTComponent {
  constructor(
    name: string,
    args: MyComponentArgs,
    opts?: ComponentResourceOptions
  ) {
    super("sst:aws:MyComponent", name, args, opts);
    
    // Implementation
    this.registerOutputs({ url: this.url });
  }

  protected getLinkProperties(): Record<string, unknown> {
    return { url: this.url };
  }
}
```

**CLI Commands**:
```bash
# Generate new SST component plugin
sst-toolkit plugin create my-component --template aws

# Test plugin
sst-toolkit plugin test my-component

# Publish plugin
sst-toolkit plugin publish my-component
```

**Module Augmentation** (auto-generated):
```typescript
// Generated: src/global.d.ts
import { MyComponent as MyComponentClass, MyComponentArgs } from "./my-component.js";

declare global {
  export namespace sst {
    export namespace aws {
      export class MyComponent extends MyComponentClass {}
    }
  }
}

export {};
```

**Usage in sst.config.ts**:
```typescript
/// <reference path="./.sst/platform/config.d.ts" />
import { MyComponent } from "@sst-toolkit/plugin-sdk";

export default $config({
  async run() {
    // Direct import (works immediately)
    const component = new MyComponent("MyComponent", { /* args */ });
    
    // Or with module augmentation (after adding to tsconfig.json)
    // const component = new sst.aws.MyComponent("MyComponent", { /* args */ });
    
    return {};
  },
});
```

### 3. Explorer (`apps/explorer`)

**Purpose**: Visual tools for exploring SST infrastructure (CORE FEATURE)

**Key Features**:
- State visualization ✅ (keep and enhance)
- Workflow builder ✅ (keep and enhance)
- Resource explorer ✅ (keep and enhance)
- Relationship mapping ✅ (keep and enhance)
- Cost analysis ✅ (keep and enhance)
- Plugin marketplace browser (NEW - shows installed plugins)
- Plugin dependency visualization (NEW - shows plugin relationships)

**Improvements**:
- Remove duplicate code (use `@sst-toolkit/core`)
- Add plugin marketplace integration
- Show installed plugins
- Visualize plugin dependencies
- **Maintain all existing visualization features**

### 4. CLI (`apps/cli`)

**Purpose**: Command-line tools for SST development

**Key Features**:
- Plugin management (create, test, publish)
- State exploration
- Component generation
- Plugin discovery

**Commands**:
```bash
# Plugin management
sst-toolkit plugin create <name>
sst-toolkit plugin test <name>
sst-toolkit plugin publish <name>
sst-toolkit plugin list
sst-toolkit plugin install <name>

# State exploration
sst-toolkit explore <state-file>
sst-toolkit visualize <state-file>

# Component generation
sst-toolkit generate component <name>
sst-toolkit generate adapter <name>
```

### 5. Shared Package (`packages/shared`)

**Purpose**: Shared types and utilities (minimal, only what's truly shared)

**Key Principle**: Only types and pure utilities, no business logic

**Structure**:
```
packages/shared/
├── src/
│   ├── types/             # Type definitions only
│   ├── constants/          # Constants
│   └── schemas/            # Validation schemas
```

## Architecture Principles

### 1. Adapter Pattern First

**Principle**: Everything extends SST, nothing modifies it

**Implementation**:
- Components extend SST's `Component` class from `sst/components/component`
- `ComponentAdapter` wraps SST's `Component` to handle requirements automatically
- `SSTComponent` extends `ComponentAdapter` and implements `Link.Linkable`
- Plugins are npm packages with peer dependencies on `sst` and `@pulumi/pulumi`
- No modifications to SST core
- Module augmentation enables native `sst.aws.*` syntax (optional)

### 2. Single Source of Truth

**Principle**: Each piece of logic lives in one place

**Implementation**:
- State parsing: `@sst-toolkit/core/src/state`
- Relationship detection: `@sst-toolkit/core/src/relationships`
- Explorer uses core, doesn't duplicate

### 3. Plugin-First Architecture

**Principle**: Everything should be extensible via plugins

**Implementation**:
- Component creation: Plugin system
- Visualization: Plugin renderers
- Analysis: Plugin analyzers

### 4. Developer Experience

**Principle**: Make it easy to create and share plugins

**Implementation**:
- CLI generators
- Templates
- Testing utilities
- Publishing helpers

## Migration Plan

### Phase 1: Consolidate Core (Week 1)

**Tasks**:
- [ ] Move state parsing from `packages/shared` to `packages/core`
- [ ] Move relationship detection from `packages/shared` to `packages/core`
- [ ] Remove duplicate code from `apps/explorer`
- [ ] Update all imports

**Deliverables**:
- Single source of truth for core utilities
- No code duplication

### Phase 2: Adapter Layer (Week 2)

**Tasks**:
- [ ] Create `ComponentAdapter` base class in `packages/core/src/adapters/component.ts`
  - Extends SST's `Component` from `sst/components/component`
  - Handles Pulumi type setting
  - Sets static `__pulumiType` property automatically
- [ ] Create `SSTComponent` helper in `packages/plugin-sdk/src/component/sst-component.ts`
  - Extends `ComponentAdapter`
  - Implements `Link.Linkable` interface
  - Provides `getLinkProperties()` abstract method
- [ ] Add validation utilities
  - Validate Pulumi type format: `sst:namespace:Type`
  - Check parent is set for child resources
  - Verify outputs are registered
  - Validate Link.Linkable implementation
- [ ] Create plugin loader (for future use)

**Deliverables**:
- `ComponentAdapter` base class (handles SST requirements)
- `SSTComponent` helper class (simplifies component creation)
- Validation utilities (catch common mistakes)
- Type definitions and interfaces

### Phase 3: Plugin SDK Enhancement (Week 3)

**Tasks**:
- [ ] Create component templates
  - AWS template (with ApiGatewayV2, Function, etc.)
  - Cloudflare template (with Worker, KV, etc.)
  - Basic template (minimal structure)
- [ ] Create component generator
  - Generate component class from template
  - Generate module augmentation file (`global.d.ts`)
  - Generate `package.json` with correct peer dependencies
  - Generate `tsconfig.json` configuration
  - Generate build scripts
- [ ] Add testing utilities
  - Component validator
  - Mock SST environment
  - Test helpers
- [ ] Implement publishing helpers
  - Validate before publish
  - Generate changelog
  - Version management

**Deliverables**:
- Component templates (AWS, Cloudflare, basic)
- Component generator CLI
- Module augmentation generator
- Testing utilities
- Publishing helpers

### Phase 4: CLI Enhancement (Week 4)

**Tasks**:
- [ ] Add plugin management commands
- [ ] Implement component generation
- [ ] Add plugin discovery
- [ ] Create plugin marketplace integration

**Deliverables**:
- Complete CLI toolset
- Plugin management workflow

### Phase 5: Explorer Integration (Week 5)

**Tasks**:
- [ ] Integrate with core (remove duplicates)
- [ ] Add plugin marketplace browser
- [ ] Show installed plugins
- [ ] Visualize plugin dependencies

**Deliverables**:
- Integrated explorer
- Plugin marketplace UI

## Key Improvements

### 1. Dual Purpose: Extension + Visualization

**The toolkit serves TWO purposes**:

1. **Extend SST** (NEW - Adapter Pattern):
```typescript
// Create SST components as plugins
import { SSTComponent } from '@sst-toolkit/plugin-sdk/component';
import type { ComponentResourceOptions } from '@pulumi/pulumi';
import { ApiGatewayV2 } from 'sst/components/aws/apigatewayv2';

export interface MyComponentArgs {
  handler: Input<string>;
}

export class MyComponent extends SSTComponent {
  private readonly _api: ApiGatewayV2;

  constructor(
    name: string,
    args: MyComponentArgs,
    opts?: ComponentResourceOptions
  ) {
    // SSTComponent handles all SST requirements automatically
    super("sst:aws:MyComponent", name, args, opts);
    
    // Create resources with { parent: this }
    const api = new ApiGatewayV2(
      `${name}Api`,
      { /* config */ },
      { parent: this } // IMPORTANT: Set parent
    );
    
    this._api = api;
    
    // Register outputs
    this.registerOutputs({ url: this.url });
  }

  public get url() {
    return this._api.url;
  }

  // Implement Link.Linkable interface
  protected getLinkProperties(): Record<string, unknown> {
    return { url: this.url };
  }
}
```

2. **Explore SST** (EXISTING - Visualization):
```typescript
// Visualize SST infrastructure
import { State, Relationships } from '@sst-toolkit/core';

const state = await loadSSTState();
const resources = State.parseState(state);
const relationships = Relationships.parseResourceRelationships(resources);
// Use in explorer app for visualization
```

**Both capabilities work together**:
- Create components → Visualize them in explorer
- Install plugins → See them in plugin marketplace
- Build workflows → Visualize relationships

### 2. Plugin System (Extension + Visualization)

**Before**:
- No plugin system for SST components
- Manual component creation
- No templates or generators
- Visualization exists but can't show plugins

**After**:
```bash
# Generate plugin (EXTENSION)
sst-toolkit plugin create my-component --template aws

# Test plugin
sst-toolkit plugin test my-component

# Publish plugin
sst-toolkit plugin publish my-component

# Visualize in explorer (VISUALIZATION)
sst-toolkit explore --show-plugins
# Opens explorer showing:
# - SST resources
# - Installed plugins
# - Plugin dependencies
# - Component relationships
```

### 3. Code Consolidation

**Before**:
- State parsing in 3 places
- Relationship detection duplicated
- Inconsistent implementations

**After**:
- Single source of truth in `@sst-toolkit/core`
- All apps use core utilities
- Consistent implementations

### 4. Developer Experience

**Before**:
- Manual plugin creation
- No templates
- No testing utilities

**After**:
- CLI generators
- Templates for common patterns
- Testing utilities
- Publishing helpers

## Comparison with Current Approach

| Aspect | Current | Proposed |
|--------|---------|----------|
| **Pattern** | Standalone toolkit (visualization only) | Adapter pattern + Visualization |
| **Focus** | Visualization ✅ | Component creation + Visualization ✅ |
| **Plugin System** | For toolkit extensions | For SST components + Toolkit extensions |
| **Code Organization** | Duplicated | Single source of truth |
| **Developer Experience** | Manual | CLI generators + templates |
| **Integration** | Reads SST state | Extends SST functionality + Reads SST state |
| **Visualization** | ✅ Core feature | ✅ Core feature (enhanced) |
| **Exploration** | ✅ Core feature | ✅ Core feature (enhanced) |

## Success Criteria

### Technical
- [ ] Zero code duplication
- [ ] All apps use core utilities
- [ ] Plugin system works for SST components
- [ ] CLI generators functional
- [ ] Type safety throughout
- [ ] **Visualization features maintained and enhanced**
- [ ] **Explorer app fully functional**

### Developer Experience
- [ ] Can create plugin in < 5 minutes
- [ ] Can test plugin locally
- [ ] Can publish plugin easily
- [ ] Can discover plugins easily
- [ ] **Can visualize SST infrastructure (existing feature)**
- [ ] **Can explore workflows and relationships (existing feature)**
- [ ] **Can see plugins in explorer (new feature)**

### Community
- [ ] Plugin marketplace functional
- [ ] Documentation complete
- [ ] Examples available
- [ ] Community contributions welcome
- [ ] **Visualization tools remain accessible**
- [ ] **Explorer remains a core feature**

## Questions to Answer

1. **Should we support both SST v2 and v3?**
   - Recommendation: Start with v3, add v2 later if needed

2. **How do we handle SST version compatibility?**
   - Recommendation: Peer dependencies, version checking

3. **Should plugins be in this repo or separate?**
   - Recommendation: Separate repos, registry in this repo

4. **How do we handle plugin conflicts?**
   - Recommendation: Namespace conventions, validation

5. **What's the relationship with SST's plugin system?**
   - Recommendation: Complement, not replace

## Next Steps

1. **Review this plan** with stakeholders
2. **Get feedback** on adapter pattern approach
3. **Start Phase 1** (consolidation)
4. **Iterate** based on feedback

## Research & Validation

### SST Extensibility Research

**Confirmed**: SST CAN be extended! See [SST_EXTENSIBILITY_RESEARCH.md](./SST_EXTENSIBILITY_RESEARCH.md) for detailed findings.

**Key Findings**:
1. ✅ SST components extend `Component` from `sst/components/component`
2. ✅ Components must set Pulumi type: `super("sst:namespace:Type", ...)`
3. ✅ Components must set static `__pulumiType` property
4. ✅ Child resources must have `{ parent: this }`
5. ✅ Components must register outputs: `this.registerOutputs({ ... })`
6. ✅ Linkable components implement `Link.Linkable` interface
7. ✅ Module augmentation enables `sst.aws.*` syntax (optional)

**Proven Pattern**: The `@sst/aws-bedrock` plugin demonstrates this pattern works in production.

### Validation Checklist

When creating an SST component, ensure:

- [ ] Extends `Component` or `SSTComponent`
- [ ] Sets correct Pulumi type format: `sst:namespace:Type`
- [ ] Sets `__pulumiType` static property (auto-handled by `ComponentAdapter`)
- [ ] All child resources have `{ parent: this }`
- [ ] Registers outputs with `registerOutputs()`
- [ ] Implements `Link.Linkable` if linkable (auto-handled by `SSTComponent`)
- [ ] Module augmentation file exists (optional, auto-generated)
- [ ] Peer dependencies correct in package.json (auto-generated)
- [ ] TypeScript types exported correctly (auto-generated)

## Resources

- [SST Extensibility Research](./SST_EXTENSIBILITY_RESEARCH.md) - Detailed research findings
- [BetterAuth Adapters](https://www.better-auth.com/docs/adapters/overview) - Adapter pattern inspiration
- [SST Plugin System](../sst/PLUGIN_SYSTEM.md) - SST's plugin system documentation
- [SST Component Pattern](../sst/plugins/sst-aws-bedrock/) - Example plugin implementation
- [SST Component Base Class](../sst/platform/src/components/component.ts) - SST's Component class
- [SST Bedrock Gateway Example](../sst/platform/src/components/aws/bedrock-gateway.ts) - Real-world example

---

**Let's build the best 3rd party toolkit for SST! 🚀**

