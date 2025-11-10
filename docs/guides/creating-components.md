# Creating Components

This guide explains how to create custom SST components using SST Toolkit.

## Overview

SST components are reusable infrastructure building blocks that extend SST's capabilities. They wrap Pulumi resources and provide a clean, type-safe API.

## Quick Start

The easiest way to create a component is using the CLI:

```bash
# Generate a basic component
pnpm sst-toolkit plugin create MyComponent --template basic --namespace mycompany

# Generate an AWS-focused component
pnpm sst-toolkit plugin create MyAPI --template aws --namespace mycompany

# Generate a Cloudflare-focused component
pnpm sst-toolkit plugin create MyWorker --template cloudflare --namespace mycompany
```

This generates a complete component structure ready for development.

## Manual Setup

If you prefer to set up manually:

### 1. Install Dependencies

```bash
pnpm add @sst-toolkit/plugin-sdk @pulumi/pulumi sst
pnpm add -D typescript tsup
```

### 2. Create Component

Create `src/my-component.ts`:

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
      message: props.message || "Hello!",
    });
  }

  protected getLinkProperties(): Record<string, unknown> {
    return {
      message: this.message,
    };
  }
}
```

### 3. Configure TypeScript

Create `tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 4. Configure Build

Create `tsup.config.ts`:

```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: "dist",
  external: ["@pulumi/pulumi", "sst"],
});
```

## Component Structure

A complete component should have:

```
my-component/
├── src/
│   ├── my-component.ts    # Component implementation
│   ├── index.ts            # Exports
│   └── global.d.ts         # Module augmentation (optional)
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── README.md
```

## Component Requirements

### 1. Extend SSTComponent

All components must extend `SSTComponent`:

```typescript
export class MyComponent extends Component.Component.SSTComponent {
  // ...
}
```

### 2. Implement getLinkProperties()

Required for SST Link integration:

```typescript
protected getLinkProperties(): Record<string, unknown> {
  return {
    url: this.api.url,
    id: this.id,
  };
}
```

### 3. Register Outputs

Use `this.registerOutputs()` to expose outputs:

```typescript
this.registerOutputs({
  url: this.api.url,
  tableName: this.table.name,
});
```

### 4. Valid Pulumi Type

Must follow `sst:namespace:Type` format:

```typescript
super("sst:mycompany:MyComponent", name, props, opts);
```

## Component Types

### Basic Component

Simple component with minimal functionality:

```typescript
export class Greeting extends Component.Component.SSTComponent {
  constructor(name: string, props: IGreetingProps, opts?: ComponentResourceOptions) {
    super("sst:example:Greeting", name, props, opts);
    this.registerOutputs({ message: props.message });
  }

  protected getLinkProperties(): Record<string, unknown> {
    return { message: this.message };
  }
}
```

### Resource-Wrapping Component

Component that wraps SST resources:

```typescript
export class MyAPI extends Component.Component.SSTComponent {
  private fn: Function;
  private api: ApiGatewayV2;

  constructor(name: string, props: IMyAPIProps, opts?: ComponentResourceOptions) {
    super("sst:example:MyAPI", name, props, opts);

    this.fn = new Function(`${name}Function`, {
      handler: props.handler,
    }, { parent: this });

    this.api = new ApiGatewayV2(`${name}Api`, {
      routes: { "GET /": this.fn },
    }, { parent: this });

    this.registerOutputs({ url: this.api.url });
  }

  protected getLinkProperties(): Record<string, unknown> {
    return { url: this.api.url };
  }
}
```

### Composite Component

Component that combines multiple resources:

```typescript
export class MyApp extends Component.Component.SSTComponent {
  private fn: Function;
  private api: ApiGatewayV2;
  private table: DynamoDB;

  constructor(name: string, props: IMyAppProps, opts?: ComponentResourceOptions) {
    super("sst:example:MyApp", name, props, opts);

    // Create resources with parent
    this.table = new DynamoDB(`${name}Table`, {
      fields: { id: "string" },
      primaryKey: "id",
    }, { parent: this });

    this.fn = new Function(`${name}Function`, {
      handler: props.handler,
      link: [this.table],
    }, { parent: this });

    this.api = new ApiGatewayV2(`${name}Api`, {
      routes: { "GET /": this.fn },
    }, { parent: this });

    // Register outputs
    this.registerOutputs({
      url: this.api.url,
      tableName: this.table.name,
    });
  }

  protected getLinkProperties(): Record<string, unknown> {
    return {
      url: this.api.url,
      tableName: this.table.name,
    };
  }
}
```

## Parent-Child Relationships

Always set `parent` for child resources:

```typescript
this.fn = new Function(`${name}Function`, {
  handler: props.handler,
}, { parent: this });  // Important!
```

This ensures proper resource hierarchy and cleanup.

## Module Augmentation (Optional)

For global type support, add module augmentation:

```typescript
// src/global.d.ts
import { MyComponent as MyComponentClass } from "./my-component";

declare global {
  export namespace sst {
    export namespace mycompany {
      export class MyComponent extends MyComponentClass {}
    }
  }
}

export {};
```

This allows using the component globally:

```typescript
import { App } from "sst/constructs";

export function MyStack({ stack }: App) {
  const component = new sst.mycompany.MyComponent("MyComponent", {
    // ...
  });
}
```

## Next Steps

- **[Component Examples](../examples/components.md)** - See real-world examples
- **[Component API](./component-api.md)** - Detailed API reference
- **[Best Practices](./best-practices.md)** - Development guidelines
- **[Using Components](./using-components.md)** - Learn how to use components

