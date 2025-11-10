# SST Extensibility Research

> **Can SST be extended? YES! Here's how and how we can make it easy.**

## Research Summary

**Answer**: YES, SST can be extended! The SST codebase already demonstrates this pattern with the `@sst/aws-bedrock` plugin. Users can create custom SST components as npm packages that work seamlessly with SST.

## How SST Components Work

### 1. Component Base Class

SST provides a `Component` base class that all components extend:

```typescript
// From: platform/src/components/component.ts
export class Component extends ComponentResource {
  constructor(
    type: string,        // Pulumi type: "sst:namespace:Type"
    name: string,        // Component name
    args?: Inputs,       // Component arguments
    opts?: ComponentResourceOptions
  ) {
    super(type, name, args, opts);
    // Component logic
  }
}
```

### 2. Component Pattern (From SST Repo)

Based on the `@sst/aws-bedrock` plugin example:

```typescript
// src/bedrock-gateway.ts
import { Component } from "sst/components/component";
import { Link } from "sst/components/link";
import { ComponentResourceOptions } from "@pulumi/pulumi";

export interface BedrockGatewayArgs {
  handler: Input<string | FunctionArgs>;
  modelId?: Input<string>;
  // ... other args
}

export class BedrockGateway extends Component implements Link.Linkable {
  private readonly _api: ApiGatewayV2;

  constructor(
    name: string,
    args: BedrockGatewayArgs,
    opts?: ComponentResourceOptions
  ) {
    // IMPORTANT: Set Pulumi type
    super("sst:aws:BedrockGateway", name, args, opts);

    // Create underlying resources
    const api = new ApiGatewayV2(
      `${name}Api`,
      { /* config */ },
      { parent: this } // IMPORTANT: Set parent
    );

    this._api = api;

    // IMPORTANT: Register outputs
    this.registerOutputs({
      _hint: this.url,
    });
  }

  public get url() {
    return this._api.url;
  }

  // IMPORTANT: Implement Link.Linkable interface
  public getSSTLink() {
    return {
      properties: {
        url: this.url,
      },
    };
  }
}

// IMPORTANT: Set Pulumi type as static property
const __pulumiType = "sst:aws:BedrockGateway";
// @ts-expect-error
BedrockGateway.__pulumiType = __pulumiType;
```

### 3. Module Augmentation (Optional)

To make components appear in the `sst` namespace:

```typescript
// src/global.d.ts
import { BedrockGateway as BedrockGatewayClass, BedrockGatewayArgs } from "./bedrock-gateway.js";

declare global {
  export namespace sst {
    export namespace aws {
      export class BedrockGateway extends BedrockGatewayClass {}
    }
  }
}

export {};
```

Then users can use:
```typescript
new sst.aws.BedrockGateway("Gateway", { ... });
```

## Current User Experience

### Without Toolkit (Current State)

**Step 1**: Create plugin package manually
```bash
mkdir sst-my-component
cd sst-my-component
npm init -y
# ... manual setup
```

**Step 2**: Write component manually
```typescript
// Need to know:
// - Component base class
// - Pulumi type format
// - Link.Linkable interface
// - Output registration
// - Parent setting
// - Module augmentation syntax
```

**Step 3**: Build and publish manually
```bash
# Manual build setup
# Manual type generation
# Manual publishing
```

**Problems**:
- ❌ Lots of boilerplate
- ❌ Easy to make mistakes (forget parent, outputs, etc.)
- ❌ No templates
- ❌ No validation
- ❌ Manual module augmentation

## Proposed User Experience (With Toolkit)

### With Toolkit (Proposed)

**Step 1**: Generate plugin
```bash
sst-toolkit plugin create custom-ai-bedrock --template aws
```

**Step 2**: Use in `sst.config.ts`
```typescript
/// <reference path="./.sst/platform/config.d.ts" />
import { CustomAIBedrock } from "@sst-toolkit/plugin-sdk";

export default $config({
  app(input) {
    return {
      name: "insights",
      removal: input?.stage === "prod" ? "retain" : "remove",
      protect: ["prod"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    const aiBedrock = new CustomAIBedrock("AIBedrock", {
      region: "us-east-1",
      modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
    });

    const web = new sst.aws.Nextjs("Web", {
      link: [aiBedrock],
      path: "./nextjs",
      domain: "example.com",
      dns: sst.cloudflare.dns()
    });

    return {};
  },
});
```

**Step 3**: Optional - Enable module augmentation
```typescript
// tsconfig.json
{
  "include": [
    "node_modules/@sst-toolkit/plugin-sdk/dist/global.d.ts"
  ]
}

// Now can use:
new sst.aws.CustomAIBedrock("AIBedrock", { ... });
```

**Benefits**:
- ✅ Zero boilerplate
- ✅ Templates handle all patterns
- ✅ Automatic validation
- ✅ Type safety
- ✅ Module augmentation included

## How Toolkit Can Make This Easy

### 1. Component Adapter Helper

```typescript
// packages/core/src/adapters/component.ts
import { Component } from "sst/components/component";
import { Link } from "sst/components/link";
import type { ComponentResourceOptions } from "@pulumi/pulumi";

export interface IComponentAdapterOptions {
  pulumiType: string; // e.g., "sst:aws:CustomAIBedrock"
  linkable?: boolean; // Should implement Link.Linkable?
}

export class ComponentAdapter extends Component {
  constructor(
    pulumiType: string,
    name: string,
    args: Record<string, unknown>,
    opts?: ComponentResourceOptions
  ) {
    super(pulumiType, name, args, opts);
    
    // Set static property
    const __pulumiType = pulumiType;
    // @ts-expect-error
    (this.constructor as typeof ComponentAdapter).__pulumiType = __pulumiType;
  }
}

// Helper to create linkable components
export function createLinkableComponent<T extends Component>(
  pulumiType: string,
  name: string,
  args: Record<string, unknown>,
  getLink: () => Link.Definition,
  opts?: ComponentResourceOptions
): T & Link.Linkable {
  class LinkableComponent extends ComponentAdapter implements Link.Linkable {
    constructor() {
      super(pulumiType, name, args, opts);
    }

    public getSSTLink() {
      return getLink();
    }
  }

  return new LinkableComponent() as T & Link.Linkable;
}
```

### 2. Plugin SDK Component Helper

```typescript
// packages/plugin-sdk/src/component/sst-component.ts
import { ComponentAdapter } from "@sst-toolkit/core/adapters/component";
import { Component } from "sst/components/component";
import { Link } from "sst/components/link";
import type { ComponentResourceOptions } from "@pulumi/pulumi";

/**
 * Base class for creating SST components via toolkit
 * 
 * @example
 * ```typescript
 * export class CustomAIBedrock extends SSTComponent {
 *   constructor(name: string, args: CustomAIBedrockArgs, opts?: ComponentResourceOptions) {
 *     super("sst:aws:CustomAIBedrock", name, args, opts);
 *     
 *     // Implementation
 *     this.registerOutputs({ url: this.url });
 *   }
 * }
 * ```
 */
export abstract class SSTComponent extends ComponentAdapter implements Link.Linkable {
  protected abstract getLinkProperties(): Record<string, unknown>;

  public getSSTLink(): Link.Definition {
    return {
      properties: this.getLinkProperties(),
    };
  }
}
```

### 3. Component Generator

```typescript
// packages/plugin-sdk/src/generator/component-generator.ts
export interface IComponentTemplate {
  name: string;
  namespace: string; // e.g., "aws"
  type: string; // e.g., "CustomAIBedrock"
  template: "aws" | "cloudflare" | "basic";
}

export function generateComponent(template: IComponentTemplate): string {
  const pulumiType = `sst:${template.namespace}:${template.type}`;
  
  return `
import { SSTComponent } from "@sst-toolkit/plugin-sdk/component";
import type { ComponentResourceOptions } from "@pulumi/pulumi";
import type { Input } from "sst/components/input";

export interface ${template.type}Args {
  // Add your args here
}

export class ${template.type} extends SSTComponent {
  constructor(
    name: string,
    args: ${template.type}Args,
    opts?: ComponentResourceOptions
  ) {
    super("${pulumiType}", name, args, opts);
    
    // TODO: Implement your component logic
    
    this.registerOutputs({
      // TODO: Register your outputs
    });
  }

  protected getLinkProperties(): Record<string, unknown> {
    return {
      // TODO: Return linkable properties
    };
  }
}
`;
}
```

### 4. Module Augmentation Generator

```typescript
// packages/plugin-sdk/src/generator/module-augmentation.ts
export function generateModuleAugmentation(
  componentName: string,
  namespace: string,
  importPath: string
): string {
  return `
/**
 * TypeScript module augmentation for ${componentName}
 * 
 * Add this to your tsconfig.json:
 * {
 *   "include": ["node_modules/@sst-toolkit/plugin-sdk/dist/global.d.ts"]
 * }
 */

import { ${componentName} as ${componentName}Class, ${componentName}Args } from "${importPath}";

declare global {
  export namespace sst {
    export namespace ${namespace} {
      /**
       * ${componentName} component
       * 
       * @example
       * \`\`\`typescript
       * const component = new sst.${namespace}.${componentName}("Name", {
       *   // args
       * });
       * \`\`\`
       */
      export class ${componentName} extends ${componentName}Class {}
    }
  }
}

export {};
`;
}
```

## Implementation Plan

### Phase 1: Core Adapter Layer

**Goal**: Provide base classes and helpers for creating SST components

**Tasks**:
1. Create `ComponentAdapter` base class in `@sst-toolkit/core`
2. Create `SSTComponent` helper in `@sst-toolkit/plugin-sdk`
3. Add validation utilities
4. Add type helpers

**Deliverables**:
- `@sst-toolkit/core/adapters/component` - Base adapter
- `@sst-toolkit/plugin-sdk/component/sst-component` - SST component helper
- Type definitions and interfaces

### Phase 2: Component Generator

**Goal**: CLI tool to generate SST component plugins

**Tasks**:
1. Create component generator CLI command
2. Add templates for common patterns (AWS, Cloudflare, basic)
3. Generate module augmentation files
4. Generate package.json with correct peer dependencies

**Deliverables**:
- `sst-toolkit plugin create <name>` command
- Templates for AWS, Cloudflare, basic components
- Auto-generated module augmentation

### Phase 3: Validation & Testing

**Goal**: Ensure components work correctly with SST

**Tasks**:
1. Create component validator
2. Add testing utilities
3. Create example components
4. Document best practices

**Deliverables**:
- Component validator
- Testing utilities
- Example components
- Documentation

## Example: CustomAIBedrock Component

### Generated by Toolkit

```typescript
// Generated: packages/plugins/custom-ai-bedrock/src/custom-ai-bedrock.ts
import { SSTComponent } from "@sst-toolkit/plugin-sdk/component";
import type { ComponentResourceOptions } from "@pulumi/pulumi";
import type { Input } from "sst/components/input";
import { ApiGatewayV2 } from "sst/components/aws/apigatewayv2";
import { Function } from "sst/components/aws/function";

export interface CustomAIBedrockArgs {
  region?: Input<string>;
  modelId: Input<string>;
  handler?: Input<string>;
}

export class CustomAIBedrock extends SSTComponent {
  private readonly _api: ApiGatewayV2;

  constructor(
    name: string,
    args: CustomAIBedrockArgs,
    opts?: ComponentResourceOptions
  ) {
    super("sst:aws:CustomAIBedrock", name, args, opts);

    const api = new ApiGatewayV2(
      `${name}Api`,
      {
        routes: {
          "POST /v1/chat/completions": {
            handler: args.handler || "src/handler.main",
            // ... config
          },
        },
      },
      { parent: this }
    );

    this._api = api;

    this.registerOutputs({
      url: this.url,
    });
  }

  public get url() {
    return this._api.url;
  }

  protected getLinkProperties(): Record<string, unknown> {
    return {
      url: this.url,
    };
  }
}
```

### Module Augmentation (Auto-generated)

```typescript
// Generated: packages/plugins/custom-ai-bedrock/src/global.d.ts
import { CustomAIBedrock as CustomAIBedrockClass, CustomAIBedrockArgs } from "./custom-ai-bedrock.js";

declare global {
  export namespace sst {
    export namespace aws {
      export class CustomAIBedrock extends CustomAIBedrockClass {}
    }
  }
}

export {};
```

### Usage in sst.config.ts

```typescript
/// <reference path="./.sst/platform/config.d.ts" />
import { CustomAIBedrock } from "@sst-toolkit/plugin-sdk";

export default $config({
  app(input) {
    return {
      name: "insights",
      removal: input?.stage === "prod" ? "retain" : "remove",
      protect: ["prod"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    // Direct import (works immediately)
    const aiBedrock = new CustomAIBedrock("AIBedrock", {
      region: "us-east-1",
      modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
    });

    // Or with module augmentation (after adding to tsconfig.json)
    // const aiBedrock = new sst.aws.CustomAIBedrock("AIBedrock", {
    //   region: "us-east-1",
    //   modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
    // });

    const web = new sst.aws.Nextjs("Web", {
      link: [aiBedrock], // Works with linking!
      path: "./nextjs",
      domain: "example.com",
      dns: sst.cloudflare.dns()
    });

    return {};
  },
});
```

## Key Requirements

### 1. SST Component Requirements

For a component to work with SST, it must:

1. ✅ **Extend `Component`** from `sst/components/component`
2. ✅ **Set Pulumi type** in constructor: `super("sst:namespace:Type", ...)`
3. ✅ **Set static `__pulumiType`** property
4. ✅ **Set parent** for child resources: `{ parent: this }`
5. ✅ **Register outputs**: `this.registerOutputs({ ... })`
6. ✅ **Implement `Link.Linkable`** if linkable: `getSSTLink()`

### 2. Toolkit Requirements

To make this easy, toolkit should provide:

1. ✅ **Base class** that handles all requirements
2. ✅ **Templates** for common patterns
3. ✅ **Generator** CLI command
4. ✅ **Validation** to catch mistakes
5. ✅ **Module augmentation** helpers
6. ✅ **Type safety** throughout

## Validation Checklist

When creating an SST component, ensure:

- [ ] Extends `Component` or `SSTComponent`
- [ ] Sets correct Pulumi type format: `sst:namespace:Type`
- [ ] Sets `__pulumiType` static property
- [ ] All child resources have `{ parent: this }`
- [ ] Registers outputs with `registerOutputs()`
- [ ] Implements `Link.Linkable` if linkable
- [ ] Module augmentation file exists (optional)
- [ ] Peer dependencies correct in package.json
- [ ] TypeScript types exported correctly

## Comparison: Manual vs Toolkit

| Aspect | Manual | With Toolkit |
|--------|--------|--------------|
| **Setup Time** | 30+ minutes | < 5 minutes |
| **Boilerplate** | Manual | Auto-generated |
| **Validation** | Manual testing | Automatic |
| **Module Augmentation** | Manual | Auto-generated |
| **Type Safety** | Manual | Built-in |
| **Templates** | None | Multiple |
| **Documentation** | Manual | Auto-generated |

## Next Steps

1. **Implement Component Adapter** in `@sst-toolkit/core`
2. **Create SSTComponent Helper** in `@sst-toolkit/plugin-sdk`
3. **Build Component Generator** CLI command
4. **Create Templates** for common patterns
5. **Add Validation** utilities
6. **Document** the process

## Resources

- [SST Component Base Class](../sst/platform/src/components/component.ts)
- [SST Bedrock Gateway Example](../sst/platform/src/components/aws/bedrock-gateway.ts)
- [SST Plugin System](../sst/PLUGIN_SYSTEM.md)
- [SST Plugin Guide](../sst/plugins/sst-aws-bedrock/PLUGIN_GUIDE.md)

---

**Conclusion**: SST CAN be extended! The toolkit should make it EASY by providing:
- Base classes and helpers
- Component generator CLI
- Templates and validation
- Module augmentation support

