# Custom Component Example

This is an example custom SST component created using the SST Toolkit.

## Usage

```typescript
import { MyComponent } from "@example/custom-component";

const component = new MyComponent("MyComponent", {
  message: "Hello World!",
});
```

## Building

```bash
pnpm build
```

## Testing

This component demonstrates:
- Extending `SSTComponent` base class
- Setting Pulumi type format: `sst:example:MyComponent`
- Registering outputs
- Implementing `Link.Linkable` interface

