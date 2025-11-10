import { describe, it, expect } from "vitest";
import { generateComponent } from "./component-generator";
import * as Templates from "../templates";

describe("Component Generator", () => {
  it("should generate basic component code", () => {
    const code = generateComponent({
      componentName: "MyComponent",
      namespace: "example",
      template: Templates.Basic.Basic,
    });

    expect(code).toContain("MyComponent");
    expect(code).toContain("sst:example:MyComponent");
    expect(code).toContain("extends Component.Component.SSTComponent");
  });

  it("should generate AWS component code", () => {
    const code = generateComponent({
      componentName: "MyAPI",
      namespace: "example",
      template: Templates.AWS.AWS,
    });

    expect(code).toContain("MyAPI");
    expect(code).toContain("sst:example:MyAPI");
    expect(code).toContain("Function");
    expect(code).toContain("ApiGatewayV2");
    expect(code).toContain("DynamoDB");
  });

  it("should generate Cloudflare component code", () => {
    const code = generateComponent({
      componentName: "MyWorker",
      namespace: "example",
      template: Templates.Cloudflare.Cloudflare,
    });

    expect(code).toContain("MyWorker");
    expect(code).toContain("sst:example:MyWorker");
    expect(code).toContain("Worker");
  });

  it("should use correct namespace in Pulumi type", () => {
    const code = generateComponent({
      componentName: "TestComponent",
      namespace: "mycompany",
      template: Templates.Basic.Basic,
    });

    expect(code).toContain("sst:mycompany:TestComponent");
  });
});

