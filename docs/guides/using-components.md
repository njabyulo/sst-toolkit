# Using Components

This guide explains how to use custom SST components in your SST projects.

## Installation

### From npm

```bash
pnpm add @mycompany/my-component
```

### From GitHub

```bash
pnpm add git+https://github.com/mycompany/my-component.git
```

### From Local Path

```bash
pnpm add ./path/to/my-component
```

## Basic Usage

### Import and Use

```typescript
// sst.config.ts
import { MyComponent } from "@mycompany/my-component";

export default {
  stacks(app) {
    app.stack(function MyStack({ stack }) {
      const component = new MyComponent("MyComponent", {
        message: "Hello, World!",
      });

      stack.addOutputs({
        output: component.message,
      });
    });
  },
};
```

### With Module Augmentation

If the component includes module augmentation:

```typescript
// sst.config.ts
import { App } from "sst/constructs";

export default {
  stacks(app) {
    app.stack(function MyStack({ stack }) {
      const component = new sst.mycompany.MyComponent("MyComponent", {
        message: "Hello, World!",
      });

      stack.addOutputs({
        output: component.message,
      });
    });
  },
};
```

## Using Links

Components that implement `Link.Linkable` can be linked to functions:

```typescript
import { MyAPI } from "@mycompany/my-api";
import { Function } from "sst/components/function";

export default {
  stacks(app) {
    app.stack(function MyStack({ stack }) {
      const api = new MyAPI("MyAPI", {
        handler: "packages/functions/api.handler",
      });

      // Link the API to a function
      const fn = new Function("MyFunction", {
        handler: "packages/functions/handler.handler",
        link: [api],
      });

      stack.addOutputs({
        apiUrl: api.url,
      });
    });
  },
};
```

## Type Safety in Functions

When components are linked, they provide type-safe access in functions:

```typescript
// packages/functions/handler.ts
import { Resource } from "sst";

export async function handler() {
  // Type-safe access to linked component
  const apiUrl = Resource.MyAPI.url;
  const tableName = Resource.MyAPI.tableName;

  return {
    statusCode: 200,
    body: JSON.stringify({
      apiUrl,
      tableName,
    }),
  };
}
```

## Component Outputs

Components expose outputs that can be accessed:

```typescript
const component = new MyComponent("MyComponent", {
  // ... props
});

// Access outputs
console.log(component.url);
console.log(component.tableName);
console.log(component.id);
```

## Multiple Components

You can use multiple components in the same stack:

```typescript
export default {
  stacks(app) {
    app.stack(function MyStack({ stack }) {
      const api = new MyAPI("MyAPI", {
        handler: "packages/functions/api.handler",
      });

      const database = new MyDatabase("MyDatabase", {
        tableName: "my-table",
        primaryKey: "id",
      });

      const worker = new MyWorker("MyWorker", {
        script: "packages/workers/script.js",
      });

      stack.addOutputs({
        apiUrl: api.url,
        tableName: database.tableName,
        workerUrl: worker.url,
      });
    });
  },
};
```

## Component Composition

Components can be composed together:

```typescript
export default {
  stacks(app) {
    app.stack(function MyStack({ stack }) {
      // Create base components
      const database = new MyDatabase("MyDatabase", {
        tableName: "my-table",
        primaryKey: "id",
      });

      // Create API that uses the database
      const api = new MyAPI("MyAPI", {
        handler: "packages/functions/api.handler",
        link: [database],
      });

      stack.addOutputs({
        apiUrl: api.url,
        tableName: database.tableName,
      });
    });
  },
};
```

## Error Handling

Components validate inputs and throw errors for invalid configurations:

```typescript
try {
  const component = new MyComponent("MyComponent", {
    // Invalid props
  });
} catch (error) {
  console.error("Component creation failed:", error);
}
```

## Next Steps

- **[Component Examples](../examples/components.md)** - See more examples
- **[Integration Examples](../examples/integration.md)** - Real-world integration patterns
- **[Component API](./component-api.md)** - Detailed API reference

