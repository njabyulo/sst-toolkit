# Component API Reference

Complete API reference for SST Toolkit components.

## SSTComponent

Base class for all SST components.

### Import

```typescript
import * as Component from "@sst-toolkit/plugin-sdk/component";
```

### Class Definition

```typescript
abstract class SSTComponent extends ComponentAdapter implements ILinkable
```

### Constructor

```typescript
constructor(
  pulumiType: string,
  name: string,
  args?: Inputs,
  opts?: ComponentResourceOptions
)
```

**Parameters:**
- `pulumiType` (string): Pulumi type in format `sst:namespace:Type`
- `name` (string): Resource name
- `args` (Inputs, optional): Component inputs
- `opts` (ComponentResourceOptions, optional): Pulumi resource options

**Throws:**
- Error if `pulumiType` doesn't start with `sst:`
- Error if `pulumiType` format is invalid

### Methods

#### `getSSTLink(): ILinkDefinition`

Returns SST Link definition. Automatically implemented by calling `getLinkProperties()`.

**Returns:**
```typescript
{
  properties: Record<string, unknown>
}
```

#### `protected abstract getLinkProperties(): Record<string, unknown>`

Abstract method that must be implemented to return link properties.

**Returns:** Object with properties to expose via SST Link

**Example:**
```typescript
protected getLinkProperties(): Record<string, unknown> {
  return {
    url: this.api.url,
    id: this.id,
  };
}
```

#### `registerOutputs(outputs: Inputs): void`

Registers component outputs. Inherited from Pulumi's `ComponentResource`.

**Parameters:**
- `outputs` (Inputs): Output values to register

**Example:**
```typescript
this.registerOutputs({
  url: this.api.url,
  tableName: this.table.name,
});
```

## Validation

### validatePulumiType

Validates Pulumi type format.

```typescript
import * as Validator from "@sst-toolkit/core/adapters";

Validator.validatePulumiType("sst:mycompany:MyComponent");  // true
Validator.validatePulumiType("aws:s3/bucket:Bucket");  // throws error
```

**Parameters:**
- `pulumiType` (string): Type to validate

**Returns:** `true` if valid

**Throws:**
- Error if type doesn't start with `sst:`
- Error if format is not `sst:namespace:Type`
- Error if namespace or type is empty

### validateComponent

Validates a component resource.

```typescript
import * as Validator from "@sst-toolkit/core/adapters";

Validator.validateComponent(component, {
  checkPulumiType: true,
  checkLinkable: true,
});
```

**Parameters:**
- `component` (ComponentResource): Component to validate
- `options` (object, optional): Validation options
  - `checkPulumiType?: boolean` - Check Pulumi type format (default: true)
  - `checkParent?: boolean` - Check parent relationship (default: false)
  - `checkOutputs?: boolean` - Check outputs (default: false)
  - `checkLinkable?: boolean` - Check Link.Linkable implementation (default: false)

**Returns:** `true` if valid

**Throws:** Error if validation fails

## Type Definitions

### ILinkDefinition

```typescript
interface ILinkDefinition {
  properties: Record<string, unknown>;
}
```

### ILinkable

```typescript
interface ILinkable {
  getSSTLink(): ILinkDefinition;
}
```

## Usage Example

```typescript
import * as Component from "@sst-toolkit/plugin-sdk/component";
import type { ComponentResourceOptions } from "@pulumi/pulumi";
import { Function } from "sst/components/function";
import { ApiGatewayV2 } from "sst/components/api-gateway-v2";

export interface IMyAPIProps {
  handler: string;
}

export class MyAPI extends Component.Component.SSTComponent {
  private fn: Function;
  private api: ApiGatewayV2;

  constructor(
    name: string,
    props: IMyAPIProps,
    opts?: ComponentResourceOptions
  ) {
    super("sst:mycompany:MyAPI", name, props, opts);

    this.fn = new Function(`${name}Function`, {
      handler: props.handler,
    }, { parent: this });

    this.api = new ApiGatewayV2(`${name}Api`, {
      routes: { "GET /": this.fn },
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

## See Also

- **[Complete API Reference](../API.md)** - Full API documentation
- **[Creating Components](./creating-components.md)** - Component creation guide
- **[Best Practices](./best-practices.md)** - Development guidelines

