# Best Practices

Guidelines for developing high-quality SST components.

## Naming Conventions

### Component Names

- Use PascalCase: `MyAPI`, `DatabaseConnection`
- Be descriptive and specific
- Avoid generic names

**Good:**
- `MyAPI`
- `DatabaseConnection`
- `EmailService`

**Bad:**
- `Component`
- `Resource`
- `Thing`

### Namespace

- Lowercase alphanumeric + hyphens
- Use company/org name
- Keep it short

**Good:**
- `mycompany`
- `acme-corp`

**Bad:**
- `MyCompany` (uppercase)
- `my_company` (underscores)

### Pulumi Type

Always follow `sst:namespace:Type` format:

**Good:**
- `sst:mycompany:MyAPI`
- `sst:acme:Database`

**Bad:**
- `sst:MyCompany:MyAPI` (uppercase namespace)
- `mycompany:MyAPI` (missing `sst:` prefix)

## Component Structure

### Props Interface

Always define props interface:

```typescript
export interface IMyComponentProps {
  required: string;
  optional?: number;
}
```

### Constructor Pattern

```typescript
constructor(
  name: string,
  props: IMyComponentProps,
  opts?: ComponentResourceOptions
) {
  super("sst:mycompany:MyComponent", name, props, opts);
  
  // Create resources
  this.resource = new Resource(`${name}Resource`, {
    // ...
  }, { parent: this });
  
  // Register outputs
  this.registerOutputs({
    output: this.resource.output,
  });
}
```

## Resource Management

### Parent-Child Relationships

Always set parent:

```typescript
this.fn = new Function(`${name}Function`, {
  handler: props.handler,
}, { parent: this });  // Required!
```

### Resource Naming

Use consistent naming:

```typescript
this.fn = new Function(`${name}Function`, { /* ... */ });
this.api = new ApiGatewayV2(`${name}Api`, { /* ... */ });
this.table = new DynamoDB(`${name}Table`, { /* ... */ });
```

## Error Handling

### Input Validation

Validate in constructor:

```typescript
constructor(name: string, props: IMyComponentProps, opts?: ComponentResourceOptions) {
  if (!props.required) {
    throw new Error("required property is required");
  }
  
  super("sst:mycompany:MyComponent", name, props, opts);
}
```

### Type Safety

Use TypeScript types:

```typescript
export interface IMyComponentProps {
  handler: string;  // Required
  timeout?: number;  // Optional
  memory?: 128 | 256 | 512;  // Union type
}
```

## Link Properties

Always implement `getLinkProperties()`:

```typescript
protected getLinkProperties(): Record<string, unknown> {
  return {
    url: this.api.url,
    id: this.id,
  };
}
```

Expose only essential properties.

## Testing

### Unit Tests

```typescript
import { describe, it, expect } from "vitest";
import { MyComponent } from "./my-component";

describe("MyComponent", () => {
  it("should create component", () => {
    const component = new MyComponent("test", {
      required: "value",
    });
    expect(component).toBeDefined();
  });
});
```

### Integration Tests

```typescript
import { App } from "sst/constructs";
import { MyComponent } from "@mycompany/my-component";

describe("MyComponent Integration", () => {
  it("should work in SST app", () => {
    const app = new App();
    const stack = app.stack("test");
    
    const component = new MyComponent("test", {
      required: "value",
    });
    
    expect(component).toBeDefined();
  });
});
```

## Documentation

### README

Include:
- Description
- Installation
- Usage examples
- API reference
- License

### Code Comments

Add JSDoc for public APIs:

```typescript
/**
 * Creates a new API component.
 * 
 * @param name - Component name
 * @param props - Component properties
 * @param opts - Pulumi resource options
 */
export class MyAPI extends Component.Component.SSTComponent {
  // ...
}
```

## Performance

### Resource Creation

Create resources efficiently:

```typescript
// Good: Parallel creation
this.fn = new Function(/* ... */);
this.api = new ApiGatewayV2(/* ... */);

// Bad: Unnecessary sequential
const fn = new Function(/* ... */);
await fn.ready;  // Not needed
const api = new ApiGatewayV2(/* ... */);
```

### Output Registration

Only essential outputs:

```typescript
// Good
this.registerOutputs({
  url: this.api.url,
});

// Bad: Too many
this.registerOutputs({
  url: this.api.url,
  id: this.api.id,
  arn: this.api.arn,
  // ... many more
});
```

## Security

### Input Validation

Validate and sanitize:

```typescript
constructor(name: string, props: IMyComponentProps, opts?: ComponentResourceOptions) {
  if (props.handler && !props.handler.match(/^[a-zA-Z0-9._-]+$/)) {
    throw new Error("Invalid handler format");
  }
  
  super("sst:mycompany:MyComponent", name, props, opts);
}
```

### Secrets

Never log secrets:

```typescript
// Bad
console.log(`API Key: ${props.apiKey}`);

// Good
// Don't log secrets
```

## Publishing

### Versioning

Follow semantic versioning:
- `1.0.0` - Initial release
- `1.0.1` - Patch (bug fixes)
- `1.1.0` - Minor (new features, backward compatible)
- `2.0.0` - Major (breaking changes)

### Package.json

Ensure proper configuration:

```json
{
  "name": "@mycompany/my-component",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "peerDependencies": {
    "sst": "^3.0.0"
  }
}
```

## See Also

- **[Creating Components](./creating-components.md)** - Component creation guide
- **[Component API](./component-api.md)** - API reference
- **[Component Examples](../examples/components.md)** - Real-world examples

