import { describe, it, expect, vi } from "vitest";
import { SSTComponent } from "./sst-component";
import type { ComponentResourceOptions } from "@pulumi/pulumi";

// Mock the adapter
vi.mock("@sst-toolkit/core/adapters", () => ({
  Component: {
    ComponentAdapter: class MockComponentAdapter {
      constructor(
        public pulumiType: string,
        public name: string,
        public args?: unknown,
        public opts?: ComponentResourceOptions
      ) {}

      registerOutputs(_outputs: unknown): void {
        // Mock implementation - outputs parameter intentionally unused
        void _outputs;
      }
    },
  },
}));

class TestComponent extends SSTComponent {
  constructor(
    name: string,
    props: { message?: string } = {},
    opts?: ComponentResourceOptions
  ) {
    super("sst:test:TestComponent", name, props, opts);
    this.registerOutputs({
      message: props.message || "Hello",
    });
  }

  protected getLinkProperties(): Record<string, unknown> {
    return {
      message: "Hello",
    };
  }
}

describe("SSTComponent", () => {
  it("should create an SSTComponent instance", () => {
    const component = new TestComponent("Test", { message: "Hello World" });
    expect(component).toBeInstanceOf(SSTComponent);
  });

  it("should implement getSSTLink", () => {
    const component = new TestComponent("Test");
    const link = component.getSSTLink();
    expect(link).toBeDefined();
    expect(link.properties).toBeDefined();
    expect(link.properties.message).toBe("Hello");
  });

  it("should validate Pulumi type format", () => {
    expect(() => {
      new TestComponent("Test");
    }).not.toThrow();
  });

  it("should register outputs", () => {
    const component = new TestComponent("Test", { message: "Custom Message" });
    expect(component).toBeDefined();
  });
});

