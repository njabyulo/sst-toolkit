# Integration Examples

Examples of integrating SST Toolkit components in SST projects.

## Basic Integration

### Simple Component Usage

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

## API Integration

### API with Function

```typescript
// sst.config.ts
import { MyAPI } from "@mycompany/my-api";

export default {
  stacks(app) {
    app.stack(function MyStack({ stack }) {
      const api = new MyAPI("MyAPI", {
        handler: "packages/functions/api.handler",
      });

      stack.addOutputs({
        apiUrl: api.url,
      });
    });
  },
};
```

### Function Handler

```typescript
// packages/functions/api.ts
import { Resource } from "sst";

export async function handler() {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Hello from API!",
    }),
  };
}
```

## Database Integration

### API with Database

```typescript
// sst.config.ts
import { MyApp } from "@mycompany/my-app";

export default {
  stacks(app) {
    app.stack(function MyStack({ stack }) {
      const app = new MyApp("MyApp", {
        handler: "packages/functions/api.handler",
        tableName: "my-table",
      });

      stack.addOutputs({
        apiUrl: app.url,
        tableName: app.tableName,
      });
    });
  },
};
```

### Function with Database Link

```typescript
// packages/functions/api.ts
import { Resource } from "sst";

export async function handler() {
  // Type-safe access to linked database
  const tableName = Resource.MyApp.tableName;

  return {
    statusCode: 200,
    body: JSON.stringify({
      tableName,
    }),
  };
}
```

## Multiple Components

### Using Multiple Components

```typescript
// sst.config.ts
import { MyAPI } from "@mycompany/my-api";
import { MyDatabase } from "@mycompany/my-database";
import { MyWorker } from "@mycompany/my-worker";

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

### Composing Components

```typescript
// sst.config.ts
import { MyDatabase } from "@mycompany/my-database";
import { MyAPI } from "@mycompany/my-api";

export default {
  stacks(app) {
    app.stack(function MyStack({ stack }) {
      // Create base component
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

## Type Safety

### Using Links with Type Safety

```typescript
// sst.config.ts
import { MyApp } from "@mycompany/my-app";

export default {
  stacks(app) {
    app.stack(function MyStack({ stack }) {
      const app = new MyApp("MyApp", {
        handler: "packages/functions/api.handler",
        tableName: "my-table",
      });

      stack.addOutputs({
        apiUrl: app.url,
        tableName: app.tableName,
      });
    });
  },
};
```

### Function with Type-Safe Links

```typescript
// packages/functions/api.ts
import { Resource } from "sst";

export async function handler() {
  // Type-safe access to linked component
  const apiUrl = Resource.MyApp.url;
  const tableName = Resource.MyApp.tableName;

  return {
    statusCode: 200,
    body: JSON.stringify({
      apiUrl,
      tableName,
    }),
  };
}
```

## Module Augmentation

### Using Global Types

If components include module augmentation:

```typescript
// sst.config.ts
import { App } from "sst/constructs";

export default {
  stacks(app) {
    app.stack(function MyStack({ stack }) {
      // Use global type
      const component = new sst.mycompany.MyComponent("MyComponent", {
        message: "Hello!",
      });

      stack.addOutputs({
        output: component.message,
      });
    });
  },
};
```

## See Also

- **[Component Examples](./components.md)** - More component examples
- **[Using Components](../guides/using-components.md)** - Usage guide
- **[Creating Components](../guides/creating-components.md)** - Creation guide

