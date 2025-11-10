# Component Examples

Real-world examples of SST Toolkit components.

## Basic Component

A simple greeting component:

```typescript
import * as Component from "@sst-toolkit/plugin-sdk/component";
import type { ComponentResourceOptions } from "@pulumi/pulumi";

export interface IGreetingProps {
  message?: string;
}

export class Greeting extends Component.Component.SSTComponent {
  constructor(
    name: string,
    props: IGreetingProps = {},
    opts?: ComponentResourceOptions
  ) {
    super("sst:example:Greeting", name, props, opts);

    this.registerOutputs({
      message: props.message || "Hello, World!",
    });
  }

  protected getLinkProperties(): Record<string, unknown> {
    return {
      message: this.message,
    };
  }
}
```

## API Component

A component that creates a Function and API Gateway:

```typescript
import * as Component from "@sst-toolkit/plugin-sdk/component";
import type { ComponentResourceOptions } from "@pulumi/pulumi";
import { Function } from "sst/components/function";
import { ApiGatewayV2 } from "sst/components/api-gateway-v2";

export interface IMyAPIProps {
  handler: string;
  routes?: Record<string, string>;
}

export class MyAPI extends Component.Component.SSTComponent {
  private fn: Function;
  private api: ApiGatewayV2;

  constructor(
    name: string,
    props: IMyAPIProps,
    opts?: ComponentResourceOptions
  ) {
    super("sst:example:MyAPI", name, props, opts);

    this.fn = new Function(`${name}Function`, {
      handler: props.handler,
    }, { parent: this });

    this.api = new ApiGatewayV2(`${name}Api`, {
      routes: props.routes || {
        "GET /": this.fn,
      },
    }, { parent: this });

    this.registerOutputs({
      url: this.api.url,
    });
  }

  protected getLinkProperties(): Record<string, unknown> {
    return {
      url: this.api.url,
    };
  }
}
```

## Database Component

A component that creates a DynamoDB table:

```typescript
import * as Component from "@sst-toolkit/plugin-sdk/component";
import type { ComponentResourceOptions } from "@pulumi/pulumi";
import { DynamoDB } from "sst/components/dynamodb";

export interface IMyDatabaseProps {
  tableName: string;
  primaryKey: string;
  fields?: Record<string, string>;
}

export class MyDatabase extends Component.Component.SSTComponent {
  private table: DynamoDB;

  constructor(
    name: string,
    props: IMyDatabaseProps,
    opts?: ComponentResourceOptions
  ) {
    super("sst:example:MyDatabase", name, props, opts);

    this.table = new DynamoDB(`${name}Table`, {
      fields: props.fields || {
        [props.primaryKey]: "string",
      },
      primaryKey: props.primaryKey,
    }, { parent: this });

    this.registerOutputs({
      tableName: this.table.name,
    });
  }

  protected getLinkProperties(): Record<string, unknown> {
    return {
      tableName: this.table.name,
    };
  }
}
```

## Full-Stack App Component

A component that combines Function, API Gateway, and DynamoDB:

```typescript
import * as Component from "@sst-toolkit/plugin-sdk/component";
import type { ComponentResourceOptions } from "@pulumi/pulumi";
import { Function } from "sst/components/function";
import { ApiGatewayV2 } from "sst/components/api-gateway-v2";
import { DynamoDB } from "sst/components/dynamodb";

export interface IMyAppProps {
  handler: string;
  tableName: string;
}

export class MyApp extends Component.Component.SSTComponent {
  private fn: Function;
  private api: ApiGatewayV2;
  private table: DynamoDB;

  constructor(
    name: string,
    props: IMyAppProps,
    opts?: ComponentResourceOptions
  ) {
    super("sst:example:MyApp", name, props, opts);

    // Create database
    this.table = new DynamoDB(`${name}Table`, {
      fields: {
        id: "string",
      },
      primaryKey: "id",
    }, { parent: this });

    // Create function with database link
    this.fn = new Function(`${name}Function`, {
      handler: props.handler,
      link: [this.table],
    }, { parent: this });

    // Create API Gateway
    this.api = new ApiGatewayV2(`${name}Api`, {
      routes: {
        "GET /": this.fn,
        "POST /": this.fn,
      },
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

## Cloudflare Worker Component

A component for Cloudflare Workers:

```typescript
import * as Component from "@sst-toolkit/plugin-sdk/component";
import type { ComponentResourceOptions } from "@pulumi/pulumi";
import { Worker } from "sst/components/worker";
import { KV } from "sst/components/kv";

export interface IMyWorkerProps {
  script: string;
}

export class MyWorker extends Component.Component.SSTComponent {
  private worker: Worker;
  private kv: KV;

  constructor(
    name: string,
    props: IMyWorkerProps,
    opts?: ComponentResourceOptions
  ) {
    super("sst:example:MyWorker", name, props, opts);

    this.kv = new KV(`${name}KV`, {}, { parent: this });

    this.worker = new Worker(`${name}Worker`, {
      script: props.script,
      link: [this.kv],
    }, { parent: this });

    this.registerOutputs({
      url: this.worker.url,
      kvNamespace: this.kv.namespace,
    });
  }

  protected getLinkProperties(): Record<string, unknown> {
    return {
      url: this.worker.url,
      kvNamespace: this.kv.namespace,
    };
  }
}
```

## Using Components in SST

```typescript
import { App } from "sst/constructs";
import { MyApp } from "@mycompany/my-app";

export function MyStack({ stack }: App) {
  const app = new MyApp("MyApp", {
    handler: "src/handler.handler",
    tableName: "my-table",
  });

  return {
    url: app.url,
    tableName: app.tableName,
  };
}
```

## See Also

- **[Creating Components](../guides/creating-components.md)** - Learn how to create components
- **[Using Components](../guides/using-components.md)** - Learn how to use components
- **[Integration Examples](./integration.md)** - Integration patterns

